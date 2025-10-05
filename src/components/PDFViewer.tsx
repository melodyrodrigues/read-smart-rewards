import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  bookTitle: string;
}

export const PDFViewer = ({ fileUrl, currentPage, onPageChange, bookTitle }: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageInput, setPageInput] = useState(String(currentPage));
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { toast } = useToast();

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    console.log(`PDF loaded successfully with ${numPages} pages`);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("Error loading PDF:", error);
    toast({
      title: "Error loading PDF",
      description: "Failed to load the PDF file. Please try again.",
      variant: "destructive",
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > numPages) return;
    onPageChange(newPage);
    setPageInput(String(newPage));
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput);
    if (!isNaN(page) && page >= 1 && page <= numPages) {
      handlePageChange(page);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      setScale(1.5);
    } else {
      setScale(1.0);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <form onSubmit={handlePageInputSubmit} className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Page</span>
              <Input
                type="number"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                className="w-16 text-center glass-card"
                min={1}
                max={numPages}
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                of {numPages || "..."}
              </span>
            </form>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= numPages}
              className="hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="hover:bg-primary/10"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={scale >= 3.0}
              className="hover:bg-primary/10"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="hover:bg-primary/10"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* PDF Display */}
      <Card className={`glass-card overflow-hidden ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
        <div 
          className={`bg-secondary/20 flex justify-center overflow-auto ${
            isFullscreen ? 'h-full' : 'h-[700px]'
          }`}
        >
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center h-full">
                <div className="animate-glow-pulse text-primary">Loading PDF...</div>
              </div>
            }
            error={
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8">
                  <p className="text-destructive font-semibold mb-2">Failed to load PDF</p>
                  <p className="text-sm text-muted-foreground">
                    Please check if the file exists and try again.
                  </p>
                </div>
              </div>
            }
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              loading={
                <div className="flex items-center justify-center min-h-[600px]">
                  <div className="animate-glow-pulse text-primary">Loading page...</div>
                </div>
              }
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
        </div>
      </Card>
    </div>
  );
};

export default PDFViewer;
