type StatusVariant = "offer" | "applicant" | "interview" | "match";
type BadgeSize = "sm" | "md";

const OFFER_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-gray-100 text-gray-700",
  EXPIRED: "bg-red-100 text-red-700",
};

const OFFER_LABELS: Record<string, string> = {
  PENDING: "未回答",
  ACCEPTED: "承諾済",
  REJECTED: "辞退済",
  EXPIRED: "期限切れ",
};

const APPLICANT_STYLES: Record<string, string> = {
  UNREAD: "bg-[#FFF4E5] text-[#FF9F43]",
  CONFIRMED: "bg-[#EBF3FB] text-[#4A90E2]",
  INTERVIEW_SCHEDULED: "bg-[#E8F8F0] text-[#2ECC71]",
};

const APPLICANT_LABELS: Record<string, string> = {
  UNREAD: "未確認",
  CONFIRMED: "確認済み",
  INTERVIEW_SCHEDULED: "面接予定",
};

const INTERVIEW_STYLES: Record<string, string> = {
  CONFIRMED: "bg-[#E8F8F0] text-[#2ECC71]",
  PENDING: "bg-[#FFF4E5] text-[#FF9F43]",
  SCHEDULED: "bg-[#EBF3FB] text-[#4A90E2]",
  COMPLETED: "bg-[#E8F8F0] text-[#2ECC71]",
  NO_SHOW: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const INTERVIEW_LABELS: Record<string, string> = {
  CONFIRMED: "確定",
  PENDING: "調整中",
  SCHEDULED: "予定",
  COMPLETED: "完了",
  NO_SHOW: "無断欠席",
  CANCELLED: "キャンセル",
};

const MATCH_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-gray-100 text-gray-700",
};

const MATCH_LABELS: Record<string, string> = {
  PENDING: "審査中",
  ACCEPTED: "承認済",
  REJECTED: "不採用",
};

const VARIANT_MAP: Record<StatusVariant, { styles: Record<string, string>; labels: Record<string, string> }> = {
  offer: { styles: OFFER_STYLES, labels: OFFER_LABELS },
  applicant: { styles: APPLICANT_STYLES, labels: APPLICANT_LABELS },
  interview: { styles: INTERVIEW_STYLES, labels: INTERVIEW_LABELS },
  match: { styles: MATCH_STYLES, labels: MATCH_LABELS },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-xs",
};

interface StatusBadgeProps {
  status: string;
  variant: StatusVariant;
  size?: BadgeSize;
  className?: string;
}

export function StatusBadge({ status, variant, size = "sm", className = "" }: StatusBadgeProps) {
  const { styles, labels } = VARIANT_MAP[variant];
  const style = styles[status] ?? "bg-gray-100 text-gray-500";
  const label = labels[status] ?? status;

  return (
    <span className={`inline-block rounded-xl font-medium ${sizeStyles[size]} ${style} ${className}`}>
      {label}
    </span>
  );
}
