import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Trophy, MessageSquare, LogOut, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BookCard from "@/components/BookCard";
import ChatAssistant from "@/components/ChatAssistant";
import AchievementBadge from "@/components/AchievementBadge";
import UploadBook from "@/components/UploadBook";
import heroImage from "@/assets/hero-reading.jpg";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/auth");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (!session?.user) {
      navigate("/auth");
    } else {
      await loadData();
    }
    setLoading(false);
  };

  const loadData = async () => {
    const { data: booksData } = await supabase
      .from("books")
      .select(`
        *,
        reading_progress(current_page, pages_read)
      `);
    const { data: achievementsData } = await supabase.from("user_achievements").select("*");
    
    const booksWithProgress = booksData?.map(book => ({
      ...book,
      progress: book.reading_progress?.[0] || null
    }));
    
    setBooks(booksWithProgress || []);
    setAchievements(achievementsData || []);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Successfully signed out!" });
    navigate("/auth");
  };

  const handleDeleteBook = async (bookId: string) => {
    try {
      const { error } = await supabase.from("books").delete().eq("id", bookId);
      if (error) throw error;
      toast({ title: "Book removed!" });
      loadData();
    } catch (error: any) {
      toast({ title: "Error removing book", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-glow-pulse">
          <BookOpen className="w-12 h-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cosmic-bg">
      {/* Hero Section */}
      <div className="relative h-[400px] overflow-hidden">
        <img 
          src={heroImage} 
          alt="Hero" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-start justify-center px-8 md:px-16 max-w-2xl">
          <div className="flex items-center gap-3 mb-4 animate-fade-in">
            <BookOpen className="w-12 h-12 text-primary drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
            <Sparkles className="w-8 h-8 text-accent animate-glow-pulse drop-shadow-[0_0_10px_rgba(192,132,252,0.6)]" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent animate-fade-in drop-shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            Cosmo Reader
          </h1>
          <p className="text-xl text-foreground/80 mb-6 animate-fade-in">
            Navigate the universe of knowledge with real-time space data
          </p>
          <div className="flex gap-3">
            <Button 
              onClick={() => navigate("/space-weather")}
              className="bg-gradient-primary hover:opacity-90 animate-scale-in"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Space Weather Glossary
            </Button>
            <Button 
              onClick={handleSignOut}
              variant="outline"
              className="animate-scale-in glass-card"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="library" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="library" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Library
            </TabsTrigger>
            <TabsTrigger value="assistant" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Assistant
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Achievements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-8">
            <UploadBook onUploadComplete={loadData} />
            
            {books.length > 0 ? (
              <div>
                <h2 className="text-2xl font-bold mb-4">My Books</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {books.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      progress={book.progress}
                      onClick={() => navigate(`/reader?id=${book.id}`)}
                      onDelete={handleDeleteBook}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No books added yet. Start by uploading one above!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="assistant">
            <div className="max-w-3xl mx-auto">
              <ChatAssistant />
            </div>
          </TabsContent>

          <TabsContent value="achievements">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-primary bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                🌟 Stellar Achievements
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AchievementBadge
                  type="reader"
                  earned={books.length >= 1}
                  description="Add your first book"
                />
                <AchievementBadge
                  type="scholar"
                  earned={books.length >= 5}
                  description="Add 5 books to the library"
                />
                <AchievementBadge
                  type="master"
                  earned={books.length >= 10}
                  description="Add 10 books to the library"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;