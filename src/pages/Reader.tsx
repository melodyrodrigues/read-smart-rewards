import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ChatAssistant from "@/components/ChatAssistant";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { GlossaryIndicator } from "@/components/GlossaryIndicator";
import { GlossaryPanel } from "@/components/GlossaryPanel";

const Reader = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const bookId = searchParams.get("id");

  const [book, setBook] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagesRead, setPagesRead] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageInput, setPageInput] = useState("1");
  const [viewUrl, setViewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!bookId) {
      navigate("/");
      return;
    }
    loadBook();
  }, [bookId]);
  
  const extractStoragePath = (url: string): string | null => {
    try {
      const marker = "/object/";
      const idx = url.indexOf(marker);
      if (idx === -1) return null;
      const rest = url.slice(idx + marker.length); // e.g., public/books/userid/file.pdf
      const clean = rest.split("?")[0];
      const parts = clean.split("/");
      // patterns: public/books/<path...> OR sign/books/<path...>
      if ((parts[0] === "public" || parts[0] === "sign") && parts[1] === "books") {
        return parts.slice(2).join("/");
      }
      // fallback: books/<path...>
      if (parts[0] === "books") {
        return parts.slice(1).join("/");
      }
      return null;
    } catch {
      return null;
    }
  };

  const loadBook = async () => {
    try {
      const { data: bookData, error: bookError } = await supabase
        .from("books")
        .select("*")
        .eq("id", bookId)
        .single();

      if (bookError) throw bookError;

      const { data: progressData } = await supabase
        .from("reading_progress")
        .select("*")
        .eq("book_id", bookId)
        .maybeSingle();

      setBook(bookData);
      if (progressData) {
        setCurrentPage(progressData.current_page || 1);
        setPagesRead(progressData.pages_read || 0);
        setPageInput(String(progressData.current_page || 1));
      }

      // Generate a signed URL for private buckets or fallback to stored URL
      let urlForView: string | null = null;
      let storagePath: string | null = null;

      if (bookData.file_url) {
        if (bookData.file_url.startsWith("http")) {
          storagePath = extractStoragePath(bookData.file_url);
        } else {
          // We stored the storage key directly (e.g. userId/filename.pdf)
          storagePath = bookData.file_url;
        }
      }

      if (storagePath) {
        const { data: signed, error: signErr } = await supabase
          .storage
          .from("books")
          .createSignedUrl(storagePath, 60 * 60); // 1 hour
        if (!signErr && signed?.signedUrl) {
          urlForView = signed.signedUrl;
        }
      }

      // Fallback to raw URL if signing was not possible (e.g., bucket public)
      if (!urlForView && typeof bookData.file_url === "string") {
        urlForView = bookData.file_url;
      }

      setViewUrl(urlForView);

    } catch (error: any) {
      toast({
        title: "Error loading book",
        description: error.message,
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (newPage: number) => {
    if (!bookId || !book) return;

    const newPagesRead = Math.max(pagesRead, newPage);
    
    try {
      const { data: existing } = await supabase
        .from("reading_progress")
        .select("id")
        .eq("book_id", bookId)
        .maybeSingle();

      const progressData = {
        user_id: (await supabase.auth.getUser()).data.user?.id,
        book_id: bookId,
        current_page: newPage,
        pages_read: newPagesRead,
        last_read_at: new Date().toISOString(),
      };

      if (existing) {
        await supabase
          .from("reading_progress")
          .update(progressData)
          .eq("id", existing.id);
      } else {
        await supabase.from("reading_progress").insert(progressData);
      }

      setPagesRead(newPagesRead);
    } catch (error: any) {
      console.error("Error updating progress:", error);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > book.total_pages) return;
    setCurrentPage(newPage);
    setPageInput(String(newPage));
    updateProgress(newPage);
  };

  const handlePageInputChange = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput);
    if (!isNaN(page)) {
      handlePageChange(page);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-glow-pulse">Loading...</div>
      </div>
    );
  }

  if (!book) return null;

  const progressPercent = book.total_pages > 0 
    ? (pagesRead / book.total_pages) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <GlossaryIndicator />
      
      {/* Header */}
      <div className="border-b glass-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="gap-2 hover:bg-primary/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <div className="flex gap-2">
              <GlossaryPanel />
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2 glass-card border-primary/20 hover:bg-primary/10">
                    <MessageSquare className="w-4 h-4" />
                    Assistant
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-lg glass-card">
                  <ChatAssistant bookContext={`${book.title}${book.author ? ` - ${book.author}` : ''} (page ${currentPage}/${book.total_pages})`} />
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">{book.title}</h1>
              {book.author && (
                <p className="text-muted-foreground">{book.author}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress: {pagesRead} of {book.total_pages} pages</span>
                <span className="font-semibold text-primary">{progressPercent.toFixed(0)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="container mx-auto px-4 py-6">
        <Card className="glass-card overflow-hidden">
          <div className="aspect-[3/4] bg-secondary/20">
            <iframe
              src={`${(viewUrl || book.file_url)}#page=${currentPage}`}
              className="w-full h-full"
              title={book.title}
            />
          </div>

          {/* Controls */}
          <div className="p-4 border-t glass-card flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <form onSubmit={handlePageInputChange} className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Page</span>
              <Input
                type="number"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                className="w-20 text-center glass-card"
                min={1}
                max={book.total_pages}
              />
              <span className="text-sm text-muted-foreground">
                of {book.total_pages}
              </span>
            </form>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= book.total_pages}
              className="hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reader;
