import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Upload, Loader2 } from "lucide-react";
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
  const [totalPages, setTotalPages] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("books")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Storage key relative to bucket (used to generate signed URLs)
      const fileKey = filePath;

      // Create book record
      const { data: inserted, error: insertError } = await supabase
        .from("books")
        .insert({
          title,
          author: author || null,
          file_url: fileKey,
          total_pages: parseInt(totalPages) || 0,
          user_id: user.id,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      toast({ title: "Book added successfully!" });
      setTitle("");
      setAuthor("");
      setFile(null);
      setTotalPages("");
      onUploadComplete();
      
      // Navigate to reader automatically
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

  return (
    <Card className="p-6 shadow-card">
      <h2 className="text-2xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
        Add New Book
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
              Add Book
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};

export default UploadBook;