import { Card } from "@/components/ui/card";
import badgeReader from "@/assets/badge-reader.png";
import badgeScholar from "@/assets/badge-scholar.png";
import badgeMaster from "@/assets/badge-master.png";
import badgeHubble from "@/assets/badge-hubble.png";
import badgeChandra from "@/assets/badge-chandra.png";
import badgeJWST from "@/assets/badge-jwst.png";
import badgeKeywordBronze from "@/assets/badge-keyword-bronze.png";
import badgeKeywordSilver from "@/assets/badge-keyword-silver.png";
import badgeKeywordGold from "@/assets/badge-keyword-gold.png";

interface AchievementBadgeProps {
  type: "reader" | "scholar" | "master" | "hubble" | "chandra" | "jwst" | "keyword-bronze" | "keyword-silver" | "keyword-gold";
  earned?: boolean;
  description: string;
}

const BADGE_MAP = {
  reader: { 
    img: badgeReader, 
    title: "MISSION APOLLO 1", 
    gradient: "bg-gradient-to-br from-yellow-400 via-orange-400 to-orange-500",
    glow: "shadow-[0_0_30px_hsl(35_100%_55%/0.5)]"
  },
  scholar: { 
    img: badgeScholar, 
    title: "MISSION APOLLO 2", 
    gradient: "bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600",
    glow: "shadow-[0_0_30px_hsl(210_15%_50%/0.5)]"
  },
  master: { 
    img: badgeMaster, 
    title: "MISSION APOLLO 3", 
    gradient: "bg-gradient-to-br from-purple-500 via-violet-500 to-fuchsia-500",
    glow: "shadow-[0_0_40px_hsl(280_85%_60%/0.6)]"
  },
  hubble: { 
    img: badgeHubble, 
    title: "HUBBLE EXPLORER", 
    gradient: "bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600",
    glow: "shadow-[0_0_35px_hsl(45_100%_50%/0.6)]"
  },
  chandra: { 
    img: badgeChandra, 
    title: "CHANDRA OBSERVER", 
    gradient: "bg-gradient-to-br from-blue-400 via-cyan-500 to-blue-600",
    glow: "shadow-[0_0_35px_hsl(195_85%_55%/0.6)]"
  },
  jwst: { 
    img: badgeJWST, 
    title: "JAMES WEBB PIONEER", 
    gradient: "bg-gradient-to-br from-yellow-500 via-amber-600 to-orange-500",
    glow: "shadow-[0_0_40px_hsl(35_95%_55%/0.7)]"
  },
  "keyword-bronze": { 
    img: badgeKeywordBronze, 
    title: "KEYWORD EXPLORER", 
    gradient: "bg-gradient-to-br from-orange-600 via-amber-700 to-orange-800",
    glow: "shadow-[0_0_30px_hsl(25_75%_45%/0.5)]"
  },
  "keyword-silver": { 
    img: badgeKeywordSilver, 
    title: "KEYWORD SPECIALIST", 
    gradient: "bg-gradient-to-br from-slate-300 via-gray-400 to-slate-500",
    glow: "shadow-[0_0_35px_hsl(210_10%_45%/0.6)]"
  },
  "keyword-gold": { 
    img: badgeKeywordGold, 
    title: "KEYWORD MASTER", 
    gradient: "bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600",
    glow: "shadow-[0_0_40px_hsl(45_100%_50%/0.7)]"
  },
};

const AchievementBadge = ({ type, earned = false, description }: AchievementBadgeProps) => {
  const badge = BADGE_MAP[type];

  return (
    <Card className={`glass-card p-6 text-center transition-all duration-500 ${
      earned 
        ? `${badge.glow} animate-glow-pulse scale-100 hover:scale-105` 
        : "opacity-40 grayscale hover:opacity-60"
    }`}>
      <div className="relative w-28 h-28 mx-auto mb-4">
        <div className={`absolute inset-0 ${earned ? badge.gradient : ""} rounded-full opacity-20 blur-2xl animate-pulse`} />
        <img 
          src={badge.img} 
          alt={badge.title}
          className={`relative w-full h-full object-contain transition-transform duration-300 ${
            earned ? "drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" : ""
          }`}
        />
      </div>
      <h3 className={`text-lg font-bold mb-2 transition-all duration-300 ${
        earned 
          ? `${badge.gradient} bg-clip-text text-transparent drop-shadow-sm` 
          : "text-muted-foreground"
      }`}>
        {badge.title}
      </h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      {earned && (
        <div className="mt-3 text-xs font-semibold text-primary animate-fade-in">
          ✨ Achievement Unlocked!
        </div>
      )}
    </Card>
  );
};

export default AchievementBadge;