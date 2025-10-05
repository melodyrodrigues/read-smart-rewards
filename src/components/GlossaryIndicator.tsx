import { BookOpen, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

export const GlossaryIndicator = () => {
  return (
    <Card className="fixed bottom-4 right-4 p-3 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 shadow-lg animate-fade-in z-10">
      <div className="flex items-center gap-2 text-sm">
        <BookOpen className="w-4 h-4 text-primary" />
        <span className="text-foreground/80">
          Click on <span className="text-primary font-semibold underline decoration-dotted">highlighted words</span> for definitions
        </span>
        <Sparkles className="w-4 h-4 text-accent animate-pulse" />
      </div>
    </Card>
  );
};

export default GlossaryIndicator;
