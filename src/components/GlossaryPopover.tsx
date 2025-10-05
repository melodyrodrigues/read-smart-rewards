import { useState, useRef } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Volume2, Sparkles, Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface GlossaryTerm {
  term: string;
  definition: string;
  category?: string;
  videoUrl?: string;
}

interface GlossaryPopoverProps {
  term: string;
  children: React.ReactNode;
  definition?: string;
  category?: string;
  example?: string;
}

// Predefined glossary with space-related terms
const glossaryTerms: Record<string, GlossaryTerm> = {
  ionosphere: {
    term: "Ionosphere",
    definition: "The ionosphere is a layer of Earth's atmosphere filled with electrically charged particles. It plays a crucial role in radio communications and is affected by solar activity.",
    category: "Atmosphere",
    videoUrl: "https://www.youtube.com/watch?v=FG3-p4AiXXU"
  },
  ionosfera: {
    term: "Ionosfera",
    definition: "A ionosfera é uma camada da atmosfera terrestre ionizada pela radiação solar. Ela se estende de aproximadamente 60 km a 1000 km de altitude e é crucial para a propagação de ondas de rádio.",
    category: "Camada Atmosférica",
    videoUrl: "https://www.youtube.com/watch?v=FG3-p4AiXXU"
  },
  aurora: {
    term: "Aurora",
    definition: "Auroras are natural light displays in Earth's sky, predominantly seen in high-latitude regions. They are caused by disturbances in the magnetosphere caused by solar wind.",
    category: "Phenomenon",
    videoUrl: "https://www.youtube.com/watch?v=czMh3BnHFHQ"
  },
  magnetosphere: {
    term: "Magnetosphere",
    definition: "The magnetosphere is the region of space surrounding Earth where the planet's magnetic field is the dominant force controlling the behavior of charged particles.",
    category: "Space",
    videoUrl: "https://www.youtube.com/watch?v=5l3tRSI-4Yk"
  },
  magnetosfera: {
    term: "Magnetosfera",
    definition: "A magnetosfera é a região do espaço ao redor da Terra dominada pelo campo magnético terrestre. Ela protege o planeta das partículas carregadas do vento solar.",
    category: "Região Espacial",
    videoUrl: "https://www.youtube.com/watch?v=5l3tRSI-4Yk"
  },
  radiation: {
    term: "Radiation",
    definition: "Radiation is energy that travels through space as waves or particles. Solar radiation includes electromagnetic radiation from the sun.",
    category: "Physics",
    videoUrl: "https://www.youtube.com/watch?v=0bLEb8ZuwGw"
  },
  radiacao: {
    term: "Radiação",
    definition: "Radiação espacial refere-se a partículas de alta energia (prótons, elétrons) e raios cósmicos que viajam pelo espaço. Pode ser perigosa para satélites e astronautas.",
    category: "Clima Espacial",
    videoUrl: "https://www.youtube.com/watch?v=0bLEb8ZuwGw"
  },
  satellite: {
    term: "Satellite",
    definition: "A satellite is an object that orbits around a larger object. Artificial satellites are used for communications, navigation, and Earth observation.",
    category: "Technology",
    videoUrl: "https://www.youtube.com/watch?v=VKlW8xAqM3k"
  },
  satelite: {
    term: "Satélite",
    definition: "Satélites artificiais são objetos lançados ao espaço que orbitam a Terra. São afetados pelo clima espacial, especialmente por tempestades solares e radiação.",
    category: "Tecnologia Espacial",
    videoUrl: "https://www.youtube.com/watch?v=VKlW8xAqM3k"
  },
  solar: {
    term: "Solar",
    definition: "Solar relates to the Sun. Solar activity includes phenomena like solar flares and coronal mass ejections that can affect Earth.",
    category: "Sun",
    videoUrl: "https://www.youtube.com/watch?v=3aWLN8qRtz8"
  },
  cosmic: {
    term: "Cosmic",
    definition: "Cosmic relates to the universe or outer space, especially as distinct from Earth. Cosmic rays are high-energy particles from space.",
    category: "Space",
    videoUrl: "https://www.youtube.com/watch?v=GJ4Qp2xeRds"
  },
  cosmico: {
    term: "Raios Cósmicos",
    definition: "Raios cósmicos são partículas de alta energia que se originam fora do sistema solar. Eles podem afetar satélites e até mesmo a atmosfera terrestre.",
    category: "Fenômeno Espacial",
    videoUrl: "https://www.youtube.com/watch?v=GJ4Qp2xeRds"
  },
  atmosphere: {
    term: "Atmosphere",
    definition: "The atmosphere is the layer of gases surrounding Earth, held in place by gravity. It protects life and affects weather and climate.",
    category: "Earth",
    videoUrl: "https://www.youtube.com/watch?v=VBgRU-Kn8ts"
  },
  atmosfera: {
    term: "Atmosfera",
    definition: "A atmosfera terrestre é a camada de gases que envolve o planeta. É dividida em várias camadas (troposfera, estratosfera, mesosfera, termosfera, exosfera) e interage constantemente com o clima espacial.",
    category: "Camada Terrestre",
    videoUrl: "https://www.youtube.com/watch?v=VBgRU-Kn8ts"
  }
};

export const GlossaryPopover = ({ term, children, definition, category, example }: GlossaryPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const termKey = term.toLowerCase().replace(/[^a-z]/g, '');
  const predefinedEntry = glossaryTerms[termKey];
  
  // Use provided definition or fallback to predefined glossary
  const glossaryEntry = definition ? {
    term,
    definition,
    category: category || "General",
    videoUrl: predefinedEntry?.videoUrl
  } : predefinedEntry;

  if (!glossaryEntry) {
    return <>{children}</>;
  }

  const updateKeywordClick = async (keyword: string) => {
    const lowerKeyword = keyword.toLowerCase();
    
    // Determine which telescope category this keyword belongs to
    let telescopeType: 'hubble_clicks' | 'chandra_clicks' | 'jwst_clicks' | null = null;
    
    if (lowerKeyword.includes('hubble')) {
      telescopeType = 'hubble_clicks';
    } else if (lowerKeyword.includes('chandra')) {
      telescopeType = 'chandra_clicks';
    } else if (lowerKeyword.includes('webb') || lowerKeyword.includes('jwst') || lowerKeyword.includes('james webb')) {
      telescopeType = 'jwst_clicks';
    }
    
    if (!telescopeType) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Get or create user stats
      const { data: existingStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (existingStats) {
        // Update existing stats
        await supabase
          .from('user_stats')
          .update({
            [telescopeType]: (existingStats[telescopeType] || 0) + 1,
            keyword_clicks: (existingStats.keyword_clicks || 0) + 1
          })
          .eq('user_id', user.id);
      } else {
        // Create new stats record
        await supabase
          .from('user_stats')
          .insert({
            user_id: user.id,
            [telescopeType]: 1,
            keyword_clicks: 1
          });
      }
    } catch (error) {
      console.error('Error updating keyword click stats:', error);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
      // Track keyword click when opening
      updateKeywordClick(term);
    } else {
      // Stop audio when closing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlayingAudio(false);
    }
  };

  const speakDefinition = async () => {
    if (!glossaryEntry || isLoadingAudio) return;
    
    // Stop current audio if playing
    if (audioRef.current && isPlayingAudio) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlayingAudio(false);
      return;
    }
    
    setIsLoadingAudio(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: `${glossaryEntry.term}. ${glossaryEntry.definition}`,
          voice: 'alloy'
        }
      });

      if (error) throw error;

      if (data?.audioContent) {
        // Convert base64 to audio blob
        const binaryString = atob(data.audioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(blob);
        
        // Create and play audio
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
        } else {
          audioRef.current = new Audio(audioUrl);
        }
        
        audioRef.current.onended = () => {
          setIsPlayingAudio(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        audioRef.current.play();
        setIsPlayingAudio(true);
      }
    } catch (error) {
      console.error('Error generating speech:', error);
      // Fallback to browser TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(glossaryEntry.definition);
        utterance.lang = glossaryEntry.definition.includes('é') || glossaryEntry.definition.includes('ã') ? 'pt-BR' : 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setIsLoadingAudio(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <span className="cursor-pointer text-primary hover:text-primary/80 underline decoration-dotted underline-offset-2 transition-colors">
          {children}
        </span>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 overflow-hidden bg-gradient-to-br from-background to-secondary/20 border-primary/20"
        sideOffset={5}
      >
        <div className={`relative ${isAnimating ? 'animate-scale-in' : ''}`}>
          {/* Sparkle animation overlay */}
          {isAnimating && (
            <div className="absolute inset-0 pointer-events-none">
              <Sparkles className="absolute top-2 right-2 w-4 h-4 text-primary animate-pulse" />
              <Sparkles className="absolute bottom-2 left-2 w-3 h-3 text-accent animate-pulse" style={{ animationDelay: '0.2s' }} />
              <Sparkles className="absolute top-1/2 left-1/2 w-5 h-5 text-primary/60 animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          )}
          
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                  {glossaryEntry.term}
                </h3>
                {glossaryEntry.category && (
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full inline-block mt-1">
                    {glossaryEntry.category}
                  </span>
                )}
              </div>
              
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={speakDefinition}
                  disabled={isLoadingAudio}
                  className="hover:bg-primary/10"
                  title={isPlayingAudio ? "Stop audio" : "Listen to definition"}
                >
                  {isLoadingAudio ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <Volume2 className={`w-4 h-4 text-primary ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                  )}
                </Button>
                
                {glossaryEntry.videoUrl && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(glossaryEntry.videoUrl, '_blank')}
                    className="hover:bg-accent/10"
                    title="Watch NASA video"
                  >
                    <Video className="w-4 h-4 text-accent" />
                  </Button>
                )}
              </div>
            </div>
            
            <p className="text-sm leading-relaxed text-foreground/90">
              {glossaryEntry.definition}
            </p>
            
            {example && (
              <div className="mt-2 p-2 bg-accent/10 rounded-md border-l-2 border-accent">
                <p className="text-xs font-semibold text-accent mb-1">Example:</p>
                <p className="text-xs text-foreground/80">{example}</p>
              </div>
            )}
          </div>
          
          {/* Bottom gradient accent */}
          <div className="h-1 bg-gradient-primary"></div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default GlossaryPopover;
