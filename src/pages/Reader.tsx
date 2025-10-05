import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ChatAssistant from "@/components/ChatAssistant";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { GlossaryIndicator } from "@/components/GlossaryIndicator";
import { GlossaryPanel } from "@/components/GlossaryPanel";
import { PDFViewer } from "@/components/PDFViewer";

const Reader = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const bookId = searchParams.get("id");

  const [book, setBook] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagesRead, setPagesRead] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [textPages, setTextPages] = useState<string[]>([]);

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
      }

      // Handle text books
      if (bookData.book_type === 'text' && bookData.content) {
        const pages = splitTextIntoPages(bookData.content);
        setTextPages(pages);
      }

      // Generate a signed URL for PDF books
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
        // Try signed URL first
        const { data: signed, error: signErr } = await supabase
          .storage
          .from("books")
          .createSignedUrl(storagePath, 60 * 60); // 1 hour
        if (!signErr && signed?.signedUrl) {
          urlForView = signed.signedUrl;
        } else {
          // Fallback to public URL (bucket may be public)
          const { data: pub } = supabase.storage.from("books").getPublicUrl(storagePath);
          if (pub?.publicUrl) {
            urlForView = pub.publicUrl;
          }
        }
      }

      // If the stored value is already a full URL, use it
      if (!urlForView && typeof bookData.file_url === "string" && bookData.file_url.startsWith("http")) {
        urlForView = bookData.file_url;
      }

      if (bookData.book_type === 'pdf') {
        setViewUrl(urlForView);
      }

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
    if (!book) return;
    const maxPages = book.book_type === 'text' ? textPages.length : book.total_pages;
    if (newPage < 1 || newPage > maxPages) return;
    setCurrentPage(newPage);
    updateProgress(newPage);
  };

  const splitTextIntoPages = (text: string): string[] => {
    const wordsPerPage = 300;
    const words = text.split(/\s+/);
    const pages: string[] = [];
    
    for (let i = 0; i < words.length; i += wordsPerPage) {
      pages.push(words.slice(i, i + wordsPerPage).join(' '));
    }
    
    return pages.length > 0 ? pages : [text];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-glow-pulse">Loading...</div>
      </div>
    );
  }

  if (!book) return null;

  const totalPages = book.book_type === 'text' ? textPages.length : book.total_pages;
  const progressPercent = totalPages > 0 
    ? (pagesRead / totalPages) * 100 
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
                  <ChatAssistant bookContext={`${book.title}${book.author ? ` - ${book.author}` : ''} (page ${currentPage}/${totalPages})`} />
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
                <span>Progress: {pagesRead} of {totalPages} pages</span>
                <span className="font-semibold text-primary">{progressPercent.toFixed(0)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Viewer */}
      <div className="container mx-auto px-4 py-6">
        {book.book_type === 'text' ? (
          <div className="space-y-4">
            <Card className="glass-card p-4">
              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="hover:bg-primary hover:text-primary-foreground transition-all"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {textPages.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= textPages.length}
                  className="hover:bg-primary hover:text-primary-foreground transition-all"
                >
                  Next
                </Button>
              </div>
            </Card>
            <Card className="glass-card p-8">
              <div className="prose prose-invert max-w-none">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {textPages[currentPage - 1]}
                </p>
              </div>
            </Card>
          </div>
        ) : viewUrl ? (
          <PDFViewer
            fileUrl={viewUrl}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            bookTitle={book.title}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Unable to load PDF file</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reader;
