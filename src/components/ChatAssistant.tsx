import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatAssistantProps {
  bookContext?: string;
}

const ChatAssistant = ({ bookContext }: ChatAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [spaceWeatherData, setSpaceWeatherData] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSpaceWeather = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nasa-space-weather`,
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setSpaceWeatherData(data);
        }
      } catch (error) {
        console.error("Error fetching space weather data:", error);
      }
    };
    fetchSpaceWeather();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/book-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            bookContext,
            spaceWeatherContext: spaceWeatherData,
          }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error("Failed to connect to assistant");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantMessage += content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1].content = assistantMessage;
                  return newMessages;
                });
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-card flex flex-col h-[600px]">
      <div className="p-4 border-b bg-gradient-primary">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Bot className="w-5 h-5" />
          Reading Assistant
        </h2>
        {bookContext && (
          <p className="text-xs text-white/80 mt-1">{bookContext}</p>
        )}
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="w-12 h-12 mx-auto mb-4 text-primary" />
              <p>Hello! I'm here to help with your reading questions.</p>
              <p className="text-sm mt-2">Ask a question to get started!</p>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === "user"
                    ? "bg-gradient-primary text-white"
                    : "bg-secondary"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default ChatAssistant;