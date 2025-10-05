import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Volume2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GlossaryTerm {
  term: string;
  definition: string;
  category?: string;
}

interface GlossaryPopoverProps {
  term: string;
  children: React.ReactNode;
}

// Predefined glossary with space-related terms
const glossaryTerms: Record<string, GlossaryTerm> = {
  ionosphere: {
    term: "Ionosphere",
    definition: "The ionosphere is a layer of Earth's atmosphere filled with electrically charged particles. It plays a crucial role in radio communications and is affected by solar activity.",
    category: "Atmosphere"
  },
  aurora: {
    term: "Aurora",
    definition: "Auroras are natural light displays in Earth's sky, predominantly seen in high-latitude regions. They are caused by disturbances in the magnetosphere caused by solar wind.",
    category: "Phenomenon"
  },
  magnetosphere: {
    term: "Magnetosphere",
    definition: "The magnetosphere is the region of space surrounding Earth where the planet's magnetic field is the dominant force controlling the behavior of charged particles.",
    category: "Space"
  },
  radiation: {
    term: "Radiation",
    definition: "Radiation is energy that travels through space as waves or particles. Solar radiation includes electromagnetic radiation from the sun.",
    category: "Physics"
  },
  satellite: {
    term: "Satellite",
    definition: "A satellite is an object that orbits around a larger object. Artificial satellites are used for communications, navigation, and Earth observation.",
    category: "Technology"
  },
  solar: {
    term: "Solar",
    definition: "Solar relates to the Sun. Solar activity includes phenomena like solar flares and coronal mass ejections that can affect Earth.",
    category: "Sun"
  },
  cosmic: {
    term: "Cosmic",
    definition: "Cosmic relates to the universe or outer space, especially as distinct from Earth. Cosmic rays are high-energy particles from space.",
    category: "Space"
  },
  atmosphere: {
    term: "Atmosphere",
    definition: "The atmosphere is the layer of gases surrounding Earth, held in place by gravity. It protects life and affects weather and climate.",
    category: "Earth"
  }
};

export const GlossaryPopover = ({ term, children }: GlossaryPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const termKey = term.toLowerCase().replace(/[^a-z]/g, '');
  const glossaryEntry = glossaryTerms[termKey];

  if (!glossaryEntry) {
    return <>{children}</>;
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }
  };

  const speakDefinition = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(glossaryEntry.definition);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
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
              <div>
                <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                  {glossaryEntry.term}
                </h3>
                {glossaryEntry.category && (
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full inline-block mt-1">
                    {glossaryEntry.category}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={speakDefinition}
                className="shrink-0 hover:bg-primary/10"
                title="Listen to definition"
              >
                <Volume2 className="w-4 h-4 text-primary" />
              </Button>
            </div>
            
            <p className="text-sm leading-relaxed text-foreground/90">
              {glossaryEntry.definition}
            </p>
          </div>
          
          {/* Bottom gradient accent */}
          <div className="h-1 bg-gradient-primary"></div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default GlossaryPopover;
