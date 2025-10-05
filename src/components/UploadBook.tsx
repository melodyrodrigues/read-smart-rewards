import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface UploadBookProps {
  onUploadComplete: () => void;
}

const UploadBook = ({ onUploadComplete }: UploadBookProps) => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handlePdfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("books")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: inserted, error: insertError } = await supabase
        .from("books")
        .insert({
          title,
          author: author || null,
          file_url: filePath,
          total_pages: parseInt(totalPages) || 0,
          user_id: user.id,
          book_type: 'pdf',
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      toast({ title: "Book added successfully!" });
      resetForm();
      onUploadComplete();
      
      if (inserted?.id) {
        navigate(`/reader?id=${inserted.id}`);
      }
    } catch (error: any) {
      toast({
        title: "Error adding book",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textContent || !title) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const estimatedPages = Math.ceil(textContent.length / 2000);

      const { data: inserted, error: insertError } = await supabase
        .from("books")
        .insert({
          title,
          author: author || null,
          content: textContent,
          total_pages: parseInt(totalPages) || estimatedPages,
          user_id: user.id,
          book_type: 'text',
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      toast({ title: "Text book added successfully!" });
      resetForm();
      onUploadComplete();
      
      if (inserted?.id) {
        navigate(`/reader?id=${inserted.id}`);
      }
    } catch (error: any) {
      toast({
        title: "Error adding text book",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setAuthor("");
    setFile(null);
    setTextContent("");
    setTotalPages("");
  };

  return (
    <Card className="p-6 shadow-card">
      <h2 className="text-2xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
        Add New Book
      </h2>
      
      <Tabs defaultValue="pdf" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="pdf" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload PDF
          </TabsTrigger>
          <TabsTrigger value="text" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Add Text
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pdf">
          <form onSubmit={handlePdfSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="pages">Number of Pages</Label>
              <Input
                id="pages"
                type="number"
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="file">File (PDF) *</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !file || !title}
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Add PDF Book
                </>
              )}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="text">
          <form onSubmit={handleTextSubmit} className="space-y-4">
            <div>
              <Label htmlFor="text-title">Title *</Label>
              <Input
                id="text-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="text-author">Author</Label>
              <Input
                id="text-author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="text-pages">Number of Pages (optional)</Label>
              <Input
                id="text-pages"
                type="number"
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
                placeholder="Auto-calculated if not provided"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="text-content">Book Content *</Label>
              <Textarea
                id="text-content"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                required
                placeholder="Paste or write your book content here..."
                className="mt-1 min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {textContent.length > 0 && `${textContent.length} characters, ~${Math.ceil(textContent.length / 2000)} estimated pages`}
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || !textContent || !title}
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Add Text Book
                </>
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default UploadBook;