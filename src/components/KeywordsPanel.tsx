import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GlossaryPopover } from "@/components/GlossaryPopover";
import { Sparkles, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface KeywordsPanelProps {
  books: any[];
}

// Keywords relacionadas ao clima espacial
const spaceWeatherKeywords = [
  "ionosphere",
  "ionosfera",
  "aurora",
  "magnetosphere",
  "magnetosfera",
  "radiation",
  "radiacao",
  "radiação",
  "satellite",
  "satelite",
  "satélite",
  "solar",
  "cosmic",
  "cosmico",
  "cósmico",
  "atmosphere",
  "atmosfera",
  "flare",
  "storm",
  "tempestade",
  "geomagnetic",
  "geomagnetico",
  "geomagnético",
  "coronal",
  "plasma",
  "wind",
  "vento",
  "space",
  "espacial",
  "sun",
  "sol",
  "earth",
  "terra",
];

export const KeywordsPanel = ({ books }: KeywordsPanelProps) => {
  const [nasaData, setNasaData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([]);

  useEffect(() => {
    fetchNasaData();
    extractKeywords();
  }, [books]);

  const fetchNasaData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('nasa-space-weather');
      if (error) throw error;
      setNasaData(data);
    } catch (error) {
      console.error('Error fetching NASA data:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractKeywords = () => {
    const keywords = new Set<string>();
    
    books.forEach(book => {
      const textToSearch = `${book.title} ${book.author || ''}`.toLowerCase();
      
      spaceWeatherKeywords.forEach(keyword => {
        if (textToSearch.includes(keyword.toLowerCase())) {
          keywords.add(keyword);
        }
      });
    });

    setExtractedKeywords(Array.from(keywords).sort());
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
            Space Weather Keywords
          </h2>
        </div>
        <p className="text-muted-foreground">
          Keywords detected in your library related to space weather. Click on any keyword for interactive definitions powered by NASA data.
        </p>
      </Card>

      {/* NASA Data Summary */}
      {nasaData && (
        <Card className="p-6 glass-card border-accent/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Live NASA Space Weather Data
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {nasaData.solarFlares?.count || 0}
              </div>
              <div className="text-sm text-muted-foreground">Solar Flares</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {nasaData.coronalMassEjections?.count || 0}
              </div>
              <div className="text-sm text-muted-foreground">CME Events</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {nasaData.geomagneticStorms?.count || 0}
              </div>
              <div className="text-sm text-muted-foreground">Geomagnetic Storms</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {nasaData.notifications?.count || 0}
              </div>
              <div className="text-sm text-muted-foreground">Notifications</div>
            </div>
          </div>
        </Card>
      )}

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
            No space weather keywords detected in your library titles yet.
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
