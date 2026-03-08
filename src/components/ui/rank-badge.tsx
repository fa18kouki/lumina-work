type BadgeSize = "sm" | "md";

const RANK_STYLES: Record<string, string> = {
  S: "bg-pink-100 text-pink-700",
  A: "bg-purple-100 text-purple-700",
  B: "bg-yellow-100 text-yellow-700",
  C: "bg-gray-100 text-gray-500",
};

const RANK_LABELS: Record<string, string> = {
  S: "Sランク",
  A: "Aランク",
  B: "Bランク",
  C: "Cランク",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
};

interface RankBadgeProps {
  rank: string;
  size?: BadgeSize;
  className?: string;
}

export function RankBadge({ rank, size = "sm", className = "" }: RankBadgeProps) {
  return (
    <span
      className={`inline-block rounded font-medium ${sizeStyles[size]} ${RANK_STYLES[rank] ?? RANK_STYLES.C} ${className}`}
    >
      {RANK_LABELS[rank] ?? "ランクなし"}
    </span>
  );
}
