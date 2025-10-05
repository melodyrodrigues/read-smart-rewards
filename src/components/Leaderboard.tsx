import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award, BookOpen, Sparkles, Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface LeaderboardEntry {
  user_id: string;
  email: string;
  total_achievements: number;
  keyword_clicks: number;
  books_count: number;
  total_score: number;
}

interface DailyReaderEntry {
  user_id: string;
  email: string;
  pages_read_today: number;
  books_read_today: number;
}

interface WeeklyCuriousEntry {
  user_id: string;
  email: string;
  keyword_clicks_week: number;
}

interface CollectorEntry {
  user_id: string;
  email: string;
  badge_sets_complete: number;
  total_badges: number;
}

const Leaderboard = () => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [dailyReaders, setDailyReaders] = useState<DailyReaderEntry[]>([]);
  const [weeklyCurious, setWeeklyCurious] = useState<WeeklyCuriousEntry[]>([]);
  const [collectors, setCollectors] = useState<CollectorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadAllLeaderboards();
  }, []);

  const loadAllLeaderboards = async () => {
    await Promise.all([
      loadLeaderboard(),
      loadDailyReaders(),
      loadWeeklyCurious(),
      loadCollectors()
    ]);
    setLoading(false);
  };

  const loadDailyReaders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: progressData } = await supabase
        .from("reading_progress")
        .select("user_id, pages_read, book_id")
        .gte("last_read_at", today.toISOString());

      const userMap = new Map<string, DailyReaderEntry>();

      progressData?.forEach(progress => {
        if (!userMap.has(progress.user_id)) {
          userMap.set(progress.user_id, {
            user_id: progress.user_id,
            email: progress.user_id === user?.id ? user.email || "You" : `User ${progress.user_id.substring(0, 8)}`,
            pages_read_today: 0,
            books_read_today: 0
          });
        }
        const entry = userMap.get(progress.user_id)!;
        entry.pages_read_today += progress.pages_read || 0;
        entry.books_read_today += 1;
      });

      const sortedReaders = Array.from(userMap.values())
        .sort((a, b) => b.pages_read_today - a.pages_read_today)
        .slice(0, 5);

      setDailyReaders(sortedReaders);
    } catch (error) {
      console.error("Error loading daily readers:", error);
    }
  };

  const loadWeeklyCurious = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { data: statsData } = await supabase
        .from("user_stats")
        .select("user_id, keyword_clicks, updated_at")
        .gte("updated_at", weekAgo.toISOString());

      const entries: WeeklyCuriousEntry[] = statsData?.map(stat => ({
        user_id: stat.user_id,
        email: stat.user_id === user?.id ? user.email || "You" : `User ${stat.user_id.substring(0, 8)}`,
        keyword_clicks_week: stat.keyword_clicks || 0
      })) || [];

      const sortedCurious = entries
        .sort((a, b) => b.keyword_clicks_week - a.keyword_clicks_week)
        .slice(0, 5);

      setWeeklyCurious(sortedCurious);
    } catch (error) {
      console.error("Error loading weekly curious:", error);
    }
  };

  const loadCollectors = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: achievementsData } = await supabase
        .from("user_achievements")
        .select("user_id, badge_type");

      const userMap = new Map<string, Set<string>>();

      achievementsData?.forEach(achievement => {
        if (!userMap.has(achievement.user_id)) {
          userMap.set(achievement.user_id, new Set());
        }
        userMap.get(achievement.user_id)!.add(achievement.badge_type);
      });

      const librarySet = new Set(['reader', 'scholar', 'master']);
      const keywordSet = new Set(['keyword-bronze', 'keyword-silver', 'keyword-gold']);
      const telescopeSet = new Set(['hubble', 'jwst', 'chandra']);

      const entries: CollectorEntry[] = Array.from(userMap.entries()).map(([userId, badges]) => {
        let completeSets = 0;
        
        if (Array.from(librarySet).every(badge => badges.has(badge))) completeSets++;
        if (Array.from(keywordSet).every(badge => badges.has(badge))) completeSets++;
        if (Array.from(telescopeSet).every(badge => badges.has(badge))) completeSets++;

        return {
          user_id: userId,
          email: userId === user?.id ? user.email || "You" : `User ${userId.substring(0, 8)}`,
          badge_sets_complete: completeSets,
          total_badges: badges.size
        };
      });

      const sortedCollectors = entries
        .sort((a, b) => {
          if (b.badge_sets_complete !== a.badge_sets_complete) {
            return b.badge_sets_complete - a.badge_sets_complete;
          }
          return b.total_badges - a.total_badges;
        })
        .slice(0, 5);

      setCollectors(sortedCollectors);
    } catch (error) {
      console.error("Error loading collectors:", error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      const { data: statsData } = await supabase
        .from("user_stats")
        .select("user_id, keyword_clicks");

      const { data: achievementsData } = await supabase
        .from("user_achievements")
        .select("user_id");

      const { data: booksData } = await supabase
        .from("books")
        .select("user_id");

      const userMap = new Map<string, LeaderboardEntry>();

      statsData?.forEach(stat => {
        if (!userMap.has(stat.user_id)) {
          userMap.set(stat.user_id, {
            user_id: stat.user_id,
            email: "",
            total_achievements: 0,
            keyword_clicks: stat.keyword_clicks || 0,
            books_count: 0,
            total_score: 0
          });
        }
      });

      achievementsData?.forEach(achievement => {
        const entry = userMap.get(achievement.user_id);
        if (entry) {
          entry.total_achievements += 1;
        }
      });

      booksData?.forEach(book => {
        const entry = userMap.get(book.user_id);
        if (entry) {
          entry.books_count += 1;
        }
      });

      const userIds = Array.from(userMap.keys());
      
      for (const userId of userIds) {
        const entry = userMap.get(userId);
        if (entry) {
          entry.total_score = 
            (entry.total_achievements * 100) + 
            (entry.books_count * 50) + 
            (entry.keyword_clicks * 2);
          
          if (user?.id === userId) {
            entry.email = user.email || "User";
          } else {
            entry.email = `User ${userId.substring(0, 8)}`;
          }
        }
      }

      const sortedLeaders = Array.from(userMap.values())
        .sort((a, b) => b.total_score - a.total_score)
        .slice(0, 10);

      setLeaders(sortedLeaders);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <div className="w-6 h-6 flex items-center justify-center font-bold text-muted-foreground">#{index + 1}</div>;
    }
  };

  const getRankBackground = (index: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return "bg-primary/10 border-primary";
    switch (index) {
      case 0:
        return "bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-500/30";
      case 1:
        return "bg-gradient-to-r from-gray-400/10 to-gray-500/10 border-gray-400/30";
      case 2:
        return "bg-gradient-to-r from-amber-600/10 to-amber-700/10 border-amber-600/30";
      default:
        return "bg-background/50 border-border";
    }
  };

  if (loading) {
    return (
      <Card className="glass-card border-primary/20">
        <CardContent className="py-12 text-center">
          <div className="animate-glow-pulse">
            <Trophy className="w-12 h-12 mx-auto text-primary" />
          </div>
          <p className="mt-4 text-muted-foreground">Loading leaderboards...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Daily Reader of the Day */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            📖 Reader of the Day
          </CardTitle>
          <CardDescription>
            Most pages read today
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dailyReaders.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No reading activity today yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dailyReaders.map((reader, index) => (
                <div
                  key={reader.user_id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    index === 0 
                      ? "bg-gradient-to-r from-primary/20 to-primary/10 border-2 border-primary/30" 
                      : "bg-background/50 border border-border/50"
                  } ${reader.user_id === currentUserId ? "ring-2 ring-primary/50" : ""}`}
                >
                  <div className="flex-shrink-0 font-bold text-lg w-6">
                    {index === 0 ? "👑" : `${index + 1}`}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-primary text-white text-xs">
                      {reader.email.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {reader.email}
                      {reader.user_id === currentUserId && (
                        <span className="ml-2 text-xs text-primary">(You)</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {reader.books_read_today} {reader.books_read_today === 1 ? 'book' : 'books'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">
                      {reader.pages_read_today}
                    </div>
                    <div className="text-xs text-muted-foreground">pages</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Curious */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            🔍 Curious of the Week
          </CardTitle>
          <CardDescription>
            Most keywords clicked this week
          </CardDescription>
        </CardHeader>
        <CardContent>
          {weeklyCurious.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No keyword activity this week yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {weeklyCurious.map((curious, index) => (
                <div
                  key={curious.user_id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    index === 0 
                      ? "bg-gradient-to-r from-accent/20 to-accent/10 border-2 border-accent/30" 
                      : "bg-background/50 border border-border/50"
                  } ${curious.user_id === currentUserId ? "ring-2 ring-primary/50" : ""}`}
                >
                  <div className="flex-shrink-0 font-bold text-lg w-6">
                    {index === 0 ? "🌟" : `${index + 1}`}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-primary text-white text-xs">
                      {curious.email.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {curious.email}
                      {curious.user_id === currentUserId && (
                        <span className="ml-2 text-xs text-primary">(You)</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-accent">
                      {curious.keyword_clicks_week}
                    </div>
                    <div className="text-xs text-muted-foreground">clicks</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collectors */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            ⭐ Badge Collectors
          </CardTitle>
          <CardDescription>
            Complete badge sets to rank up
          </CardDescription>
        </CardHeader>
        <CardContent>
          {collectors.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No complete badge sets yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {collectors.map((collector, index) => (
                <div
                  key={collector.user_id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    index === 0 
                      ? "bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-2 border-yellow-500/30" 
                      : "bg-background/50 border border-border/50"
                  } ${collector.user_id === currentUserId ? "ring-2 ring-primary/50" : ""}`}
                >
                  <div className="flex-shrink-0 font-bold text-lg w-6">
                    {index === 0 ? "🏆" : `${index + 1}`}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-primary text-white text-xs">
                      {collector.email.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {collector.email}
                      {collector.user_id === currentUserId && (
                        <span className="ml-2 text-xs text-primary">(You)</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {collector.total_badges} total badges
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-yellow-500">
                      {collector.badge_sets_complete}
                    </div>
                    <div className="text-xs text-muted-foreground">sets</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 p-3 bg-background/50 rounded-lg border border-border/50">
            <h4 className="text-xs font-semibold mb-2">Badge Sets</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>📚 Library: Reader + Scholar + Master</p>
              <p>🔍 Keywords: Bronze + Silver + Gold</p>
              <p>🔭 Telescopes: Hubble + JWST + Chandra</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Global Leaderboard */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Global Leaderboard
          </CardTitle>
          <CardDescription>
            Top explorers ranked by achievements, books, and keyword discoveries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leaders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No rankings yet. Be the first to earn achievements!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaders.map((leader, index) => (
                <div
                  key={leader.user_id}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${getRankBackground(
                    index,
                    leader.user_id === currentUserId
                  )}`}
                >
                  <div className="flex-shrink-0">
                    {getRankIcon(index)}
                  </div>

                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-primary text-white">
                      {leader.email.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">
                      {leader.email}
                      {leader.user_id === currentUserId && (
                        <span className="ml-2 text-xs text-primary">(You)</span>
                      )}
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                      <span>🏆 {leader.total_achievements} badges</span>
                      <span>📚 {leader.books_count} books</span>
                      <span>🔍 {leader.keyword_clicks} keywords</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                      {leader.total_score.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">points</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-background/50 rounded-lg border border-border/50">
            <h4 className="text-sm font-semibold mb-2">Score Calculation</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Each achievement badge: <strong>100 points</strong></p>
              <p>• Each book added: <strong>50 points</strong></p>
              <p>• Each keyword clicked: <strong>2 points</strong></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;
