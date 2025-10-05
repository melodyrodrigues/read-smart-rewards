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
import KeywordsPanel from "@/components/KeywordsPanel";
import heroImage from "@/assets/hero-reading.jpg";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
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
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: booksData } = await supabase
      .from("books")
      .select(`
        *,
        reading_progress(current_page, pages_read)
      `);
    const { data: achievementsData } = await supabase.from("user_achievements").select("*");
    
    // Load user stats for telescope badges
    if (user) {
      const { data: statsData } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user.id)
        .single();
      setUserStats(statsData);
    }
    
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
      <div className="relative h-[500px] overflow-hidden">
        <img 
          src={heroImage} 
          alt="Hero" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/98 via-background/85 to-background/40" />
        
        {/* Solar flare accent */}
        <div className="absolute top-20 right-20 w-96 h-96 rounded-full opacity-20 blur-3xl" 
             style={{ background: 'var(--solar-flare)' }} />
        
        <div className="absolute inset-0 flex flex-col items-start justify-center px-8 md:px-16 max-w-3xl">
          <div className="space-y-2 mb-6">
            <div className="inline-block px-4 py-1 bg-accent/20 border border-accent/30 rounded-full text-accent text-xs font-semibold tracking-wider uppercase backdrop-blur-sm">
              NASA-Powered Reading Experience
            </div>
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-primary bg-clip-text text-transparent animate-fade-in drop-shadow-[0_0_30px_rgba(252,61,33,0.4)] tracking-tight">
              COSMO READER
            </h1>
            <p className="text-xl text-muted-foreground max-w-xl">
              Explore the universe of knowledge with AI-powered assistance and real-time space weather data
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => navigate("/space-weather")}
              size="lg"
              className="bg-gradient-primary hover:opacity-90 animate-scale-in solar-pulse shadow-glow"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Space Weather
            </Button>
            <Button 
              onClick={handleSignOut}
              size="lg"
              variant="outline"
              className="animate-scale-in glass-card hover:bg-accent/10"
            >
              <LogOut className="mr-2 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="library" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 glass-card p-1 h-14">
            <TabsTrigger value="library" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
              <BookOpen className="w-5 h-5" />
              <span className="hidden sm:inline">Library</span>
            </TabsTrigger>
            <TabsTrigger value="keywords" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
              <Sparkles className="w-5 h-5" />
              <span className="hidden sm:inline">Keywords</span>
            </TabsTrigger>
            <TabsTrigger value="assistant" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
              <MessageSquare className="w-5 h-5" />
              <span className="hidden sm:inline">Assistant</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
              <Trophy className="w-5 h-5" />
              <span className="hidden sm:inline">Achievements</span>
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

          <TabsContent value="keywords">
            <KeywordsPanel books={books} />
          </TabsContent>

          <TabsContent value="assistant">
            <div className="max-w-3xl mx-auto">
              <ChatAssistant />
            </div>
          </TabsContent>

          <TabsContent value="achievements">
            <div className="max-w-6xl mx-auto space-y-12">
              <div className="text-center space-y-4">
                <div className="inline-block">
                  <h2 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(252,61,33,0.5)] tracking-tight">
                    STELLAR ACHIEVEMENTS
                  </h2>
                </div>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Complete missions and explore keywords to unlock exclusive NASA-inspired badges
                </p>
                <div className="flex items-center justify-center gap-2 text-accent">
                  <div className="w-12 h-[2px] bg-gradient-to-r from-transparent to-accent"></div>
                  <Sparkles className="w-5 h-5" />
                  <div className="w-12 h-[2px] bg-gradient-to-l from-transparent to-accent"></div>
                </div>
              </div>

              {/* Library Mission Badges */}
              <div className="glass-card p-8 rounded-lg">
                <h3 className="text-2xl font-semibold mb-6 text-center flex items-center justify-center gap-2">
                  <BookOpen className="w-6 h-6 text-primary" />
                  Library Mission Badges
                </h3>
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

              {/* Keywords Explorer Badges */}
              <div className="glass-card p-8 rounded-lg">
                <h3 className="text-2xl font-semibold mb-6 text-center flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-accent" />
                  Keywords Explorer Badges
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <AchievementBadge
                    type="keyword-bronze"
                    earned={(userStats?.keyword_clicks || 0) >= 10}
                    description="Click 10 keywords"
                  />
                  <AchievementBadge
                    type="keyword-silver"
                    earned={(userStats?.keyword_clicks || 0) >= 25}
                    description="Click 25 keywords"
                  />
                  <AchievementBadge
                    type="keyword-gold"
                    earned={(userStats?.keyword_clicks || 0) >= 50}
                    description="Click 50 keywords"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;