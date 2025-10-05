import { Card } from "@/components/ui/card";
import badgeReader from "@/assets/badge-reader.png";
import badgeScholar from "@/assets/badge-scholar.png";
import badgeMaster from "@/assets/badge-master.png";

interface AchievementBadgeProps {
  type: "reader" | "scholar" | "master";
  earned?: boolean;
  description: string;
}

const BADGE_MAP = {
  reader: { img: badgeReader, title: "Leitor Iniciante", color: "from-yellow-500 to-orange-500" },
  scholar: { img: badgeScholar, title: "Estudioso", color: "from-gray-400 to-gray-600" },
  master: { img: badgeMaster, title: "Mestre da Leitura", color: "from-purple-400 to-purple-600" },
};

const AchievementBadge = ({ type, earned = false, description }: AchievementBadgeProps) => {
  const badge = BADGE_MAP[type];

  return (
    <Card className={`p-4 text-center transition-all duration-300 ${
      earned ? "shadow-glow animate-glow-pulse" : "opacity-40 grayscale"
    }`}>
      <div className="relative w-24 h-24 mx-auto mb-3">
        <img 
          src={badge.img} 
          alt={badge.title}
          className="w-full h-full object-contain"
        />
        {earned && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-br opacity-30 blur-xl"
            style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
          />
        )}
      </div>
      <h3 className={`font-semibold mb-1 ${earned ? `bg-gradient-to-r ${badge.color} bg-clip-text text-transparent` : ""}`}>
        {badge.title}
      </h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </Card>
  );
};

export default AchievementBadge;