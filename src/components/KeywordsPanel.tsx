import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GlossaryPopover } from "@/components/GlossaryPopover";
import { Sparkles, BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface KeywordsPanelProps {
  books: any[];
}

interface KeywordWithInfo {
  keyword: string;
  hasNasaInfo: boolean;
  nasaData: any;
}

export const KeywordsPanel = ({ books }: KeywordsPanelProps) => {
  const [extractedKeywords, setExtractedKeywords] = useState<KeywordWithInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (books.length > 0) {
      analyzeBooks();
    }
  }, [books]);

  const analyzeBooks = async () => {
    setLoading(true);
    try {
      // Analyze all books
      const allKeywords: KeywordWithInfo[] = [];
      
      for (const book of books) {
        const { data, error } = await supabase.functions.invoke('analyze-book-keywords', {
          body: {
            bookTitle: book.title,
            bookAuthor: book.author,
            bookContent: book.content
          }
        });

        if (error) {
          console.error('Error analyzing book:', error);
          continue;
        }

        if (data?.success && data?.keywords) {
          allKeywords.push(...data.keywords);
        }
      }

      // Remove duplicates and sort
      const uniqueKeywords = Array.from(
        new Map(allKeywords.map(k => [k.keyword.toLowerCase(), k])).values()
      ).sort((a, b) => a.keyword.localeCompare(b.keyword));

      setExtractedKeywords(uniqueKeywords);
      
      toast({
        title: "Keywords analyzed!",
        description: `Found ${uniqueKeywords.length} keywords using AI.`,
      });
    } catch (error) {
      console.error('Error analyzing books:', error);
      toast({
        title: "Error analyzing keywords",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
        <p className="text-muted-foreground">
          Add books to see space weather keywords
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 glass-card border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            AI-Extracted Keywords
          </h2>
          {loading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
        </div>
        <p className="text-muted-foreground">
          Keywords intelligently extracted from your books using AI. Each keyword is enriched with NASA space weather information when available.
        </p>
      </Card>

      {/* Keywords Grid */}
      {loading ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Analyzing books with AI...</p>
          </div>
        </Card>
      ) : extractedKeywords.length > 0 ? (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            AI-Detected Keywords ({extractedKeywords.length})
            <Badge variant="outline" className="ml-2">
              {extractedKeywords.filter(k => k.hasNasaInfo).length} with NASA data
            </Badge>
          </h3>
          <div className="flex flex-wrap gap-3">
            {extractedKeywords.map((kwInfo, idx) => (
              <GlossaryPopover key={`${kwInfo.keyword}-${idx}`} term={kwInfo.keyword}>
                <Badge 
                  variant="secondary" 
                  className={`cursor-pointer hover:bg-primary/20 transition-colors text-base py-2 px-4 border ${
                    kwInfo.hasNasaInfo ? 'border-primary/50 bg-primary/10' : 'border-primary/30'
                  }`}
                >
                  {kwInfo.keyword}
                  {kwInfo.hasNasaInfo && (
                    <Sparkles className="w-3 h-3 ml-1 inline text-primary" />
                  )}
                </Badge>
              </GlossaryPopover>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">
            No keywords could be extracted from your books yet. Try adding more content.
          </p>
        </Card>
      )}

      {/* Books Reference */}
      <Card className="p-6 glass-card">
        <h3 className="text-lg font-semibold mb-4">
          Books in Library
        </h3>
        <div className="space-y-2">
          {books.map((book) => (
            <div 
              key={book.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
            >
              <BookOpen className="w-5 h-5 text-primary" />
              <div>
                <div className="font-medium">{book.title}</div>
                {book.author && (
                  <div className="text-sm text-muted-foreground">{book.author}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default KeywordsPanel;
