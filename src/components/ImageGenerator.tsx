import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Enter a prompt",
        description: "Please describe the image you want to generate",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-story-image", {
        body: { prompt },
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        toast({
          title: "Image generated!",
          description: "Your story illustration is ready",
        });
      }
    } catch (error: any) {
      console.error("Error generating image:", error);
      toast({
        title: "Error generating image",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;

    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `story-illustration-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Image downloaded!",
      description: "Check your downloads folder",
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          AI Story Illustrator
        </h2>
        <p className="text-muted-foreground">
          Generate beautiful illustrations for your stories using AI
        </p>
      </div>

      <Card className="glass-card p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Describe your illustration</label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: A cosmic library floating in space with books orbiting around planets, vibrant colors, digital art style..."
            className="min-h-[120px] resize-none"
          />
        </div>

        <Button
          onClick={generateImage}
          disabled={isGenerating || !prompt.trim()}
          className="w-full bg-gradient-primary hover:opacity-90"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Illustration
            </>
          )}
        </Button>
      </Card>

      {generatedImage && (
        <Card className="glass-card p-6 space-y-4">
          <div className="relative rounded-lg overflow-hidden">
            <img
              src={generatedImage}
              alt="Generated illustration"
              className="w-full h-auto"
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={downloadImage}
              className="flex-1"
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ImageGenerator;
