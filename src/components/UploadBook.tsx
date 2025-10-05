import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("books")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("books")
        .getPublicUrl(filePath);

      // Create book record
      const { error: insertError } = await supabase
        .from("books")
        .insert({
          title,
          author: author || null,
          file_url: publicUrl,
          total_pages: parseInt(totalPages) || 0,
          user_id: user.id,
        });

      if (insertError) throw insertError;

      toast({ title: "Livro adicionado com sucesso!" });
      setTitle("");
      setAuthor("");
      setFile(null);
      setTotalPages("");
      onUploadComplete();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar livro",
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
        Adicionar Novo Livro
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="author">Autor</Label>
          <Input
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="pages">Número de Páginas</Label>
          <Input
            id="pages"
            type="number"
            value={totalPages}
            onChange={(e) => setTotalPages(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="file">Arquivo (PDF) *</Label>
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
              Enviando...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Adicionar Livro
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};

export default UploadBook;