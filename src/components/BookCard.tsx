import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BookCardProps {
  book: {
    id: string;
    title: string;
    author?: string;
    cover_url?: string;
    total_pages: number;
  };
  progress?: {
    current_page: number;
    pages_read: number;
  };
  onDelete?: (id: string) => void;
  onClick: () => void;
}

const BookCard = ({ book, progress, onDelete, onClick }: BookCardProps) => {
  const progressPercent = progress && book.total_pages > 0
    ? (progress.pages_read / book.total_pages) * 100
    : 0;

  return (
    <Card 
      className="glass-card-hover group relative overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-[3/4] flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-background to-muted/30">
        {book.cover_url ? (
          <img 
            src={book.cover_url} 
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="relative">
            <BookOpen 
              className="w-16 h-16" 
              style={{
                fill: 'url(#cosmosGradient)',
                stroke: 'url(#cosmosGradient)',
              }}
            />
            <svg width="0" height="0" style={{ position: 'absolute' }}>
              <defs>
                <linearGradient id="cosmosGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(270 60% 50%)" />
                  <stop offset="100%" stopColor="hsl(190 70% 45%)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        )}
        {onDelete && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(book.id);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-2">{book.title}</h3>
        {book.author && (
          <p className="text-sm text-muted-foreground mb-3">{book.author}</p>
        )}
        
        {progress && (
          <div className="space-y-2">
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {progress.pages_read} of {book.total_pages} pages
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default BookCard;