import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface LeaderboardEntry {
  user_id: string;
  email: string;
  total_achievements: number;
  keyword_clicks: number;
  books_count: number;
  total_score: number;
}

const Leaderboard = () => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // Get user stats with aggregated data
      const { data: statsData } = await supabase
        .from("user_stats")
        .select("user_id, keyword_clicks");

      // Get achievements count per user
      const { data: achievementsData } = await supabase
        .from("user_achievements")
        .select("user_id");

      // Get books count per user
      const { data: booksData } = await supabase
        .from("books")
        .select("user_id");

      // Aggregate data by user
      const userMap = new Map<string, LeaderboardEntry>();

      // Process stats
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

      // Count achievements
      achievementsData?.forEach(achievement => {
        const entry = userMap.get(achievement.user_id);
        if (entry) {
          entry.total_achievements += 1;
        }
      });

      // Count books
      booksData?.forEach(book => {
        const entry = userMap.get(book.user_id);
        if (entry) {
          entry.books_count += 1;
        }
      });

      // Calculate scores and get user emails
      const userIds = Array.from(userMap.keys());
      
      // Get user emails from auth metadata (only visible to the user themselves)
      for (const userId of userIds) {
        const entry = userMap.get(userId);
        if (entry) {
          // Calculate total score
          entry.total_score = 
            (entry.total_achievements * 100) + 
            (entry.books_count * 50) + 
            (entry.keyword_clicks * 2);
          
          // Mask email for privacy (show only first 2 chars + domain)
          if (user?.id === userId) {
            entry.email = user.email || "User";
          } else {
            entry.email = `User ${userId.substring(0, 8)}`;
          }
        }
      }

      // Sort by score and get top 10
      const sortedLeaders = Array.from(userMap.values())
        .sort((a, b) => b.total_score - a.total_score)
        .slice(0, 10);

      setLeaders(sortedLeaders);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLoading(false);
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
          <p className="mt-4 text-muted-foreground">Loading leaderboard...</p>
        </CardContent>
      </Card>
    );
  }

  return (
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
                {/* Rank */}
                <div className="flex-shrink-0">
                  {getRankIcon(index)}
                </div>

                {/* Avatar */}
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-primary text-white">
                    {leader.email.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
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

                {/* Score */}
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

        {/* Score Calculation Info */}
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
  );
};

export default Leaderboard;
