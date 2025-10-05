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
      className="glass-card-hover group relative overflow-hidden cursor-pointer border-primary/20"
      onClick={onClick}
    >
      {/* Solar accent gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="aspect-[3/4] bg-secondary/30 flex items-center justify-center relative overflow-hidden">
        {book.cover_url ? (
          <img 
            src={book.cover_url} 
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3">
            <BookOpen className="w-16 h-16 text-primary/60" />
            <div className="text-xs text-primary/40 font-semibold tracking-wider uppercase">
              No Cover
            </div>
          </div>
        )}
        {onDelete && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(book.id);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {book.title}
          </h3>
          {book.author && (
            <p className="text-sm text-muted-foreground uppercase tracking-wide">{book.author}</p>
          )}
        </div>
        
        {progress && (
          <div className="space-y-2">
            <Progress value={progressPercent} className="h-2" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {progress.pages_read} / {book.total_pages} pages
              </span>
              <span className="text-primary font-semibold">
                {Math.round(progressPercent)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default BookCard;