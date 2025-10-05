import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GlossaryPopover } from "@/components/GlossaryPopover";
import { Sparkles, BookOpen } from "lucide-react";

interface KeywordsPanelProps {
  books: any[];
}

// Common words to exclude (stopwords in Portuguese and English)
const stopWords = new Set([
  "a", "o", "e", "de", "da", "do", "em", "para", "com", "por", "uma", "um",
  "os", "as", "dos", "das", "ao", "aos", "à", "às", "no", "na", "nos", "nas",
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "by", "from", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could", "should",
  "que", "não", "se", "mais", "como", "muito", "sua", "seu", "seus", "suas",
  "esse", "essa", "isso", "isto", "este", "esta", "aquele", "aquela", "deste",
  "desta", "neste", "nesta", "pelo", "pela", "pelos", "pelas", "também", "já",
]);

export const KeywordsPanel = ({ books }: KeywordsPanelProps) => {
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([]);

  useEffect(() => {
    extractKeywords();
  }, [books]);

  const extractKeywords = () => {
    const keywordFrequency = new Map<string, number>();
    
    books.forEach(book => {
      // Combine title, author, and content for analysis
      const textToAnalyze = [
        book.title,
        book.author || '',
        book.content || ''
      ].join(' ');

      // Extract words
      const words = textToAnalyze
        .toLowerCase()
        .replace(/[^\w\sáàâãéèêíïóôõöúçñ]/g, ' ') // Keep accented characters
        .split(/\s+/)
        .filter(word => 
          word.length > 3 && // Minimum length
          !stopWords.has(word) && // Not a stopword
          !/^\d+$/.test(word) // Not just numbers
        );

      // Count frequency
      words.forEach(word => {
        const count = keywordFrequency.get(word) || 0;
        keywordFrequency.set(word, count + 1);
      });
    });

    // Sort by frequency and take top keywords
    const sortedKeywords = Array.from(keywordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50) // Top 50 keywords
      .map(([word]) => word)
      .sort(); // Alphabetically for display

    setExtractedKeywords(sortedKeywords);
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
            Book Keywords
          </h2>
        </div>
        <p className="text-muted-foreground">
          Most frequent keywords extracted from your books. Click on any keyword to see if there's a glossary definition available.
        </p>
      </Card>

      {/* Keywords Grid */}
      {extractedKeywords.length > 0 ? (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Detected Keywords ({extractedKeywords.length})
          </h3>
          <div className="flex flex-wrap gap-3">
            {extractedKeywords.map((keyword) => (
              <GlossaryPopover key={keyword} term={keyword}>
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-primary/20 transition-colors text-base py-2 px-4 border border-primary/30"
                >
                  {keyword}
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
