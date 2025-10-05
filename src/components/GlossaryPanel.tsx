import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GlossaryPopover } from "@/components/GlossaryPopover";
import { Card } from "@/components/ui/card";

const glossaryTerms = [
  "ionosphere",
  "ionosfera",
  "aurora",
  "magnetosphere",
  "magnetosfera",
  "radiation",
  "radiacao",
  "satellite",
  "satelite",
  "solar",
  "cosmic",
  "cosmico",
  "atmosphere",
  "atmosfera",
];

export const GlossaryPanel = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 glass-card border-primary/20 hover:bg-primary/10">
          <BookOpen className="w-4 h-4" />
          Glossary
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md glass-card">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="w-5 h-5 text-primary" />
            Interactive Glossary
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Click on any term below to see its definition and hear the pronunciation.
            </p>
            
            <div className="grid gap-2">
              {glossaryTerms.map((term) => (
                <Card key={term} className="p-3 glass-card hover:bg-primary/5 transition-colors">
                  <GlossaryPopover term={term}>
                    <span className="text-base font-medium capitalize cursor-pointer">
                      {term}
                    </span>
                  </GlossaryPopover>
                </Card>
              ))}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default GlossaryPanel;
