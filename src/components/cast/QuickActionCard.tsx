"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";

type ColorVariant = "pink" | "blue" | "green" | "purple" | "gray";

interface QuickActionCardProps {
  href: string;
  label: string;
  icon: LucideIcon;
  variant: ColorVariant;
}

const variantStyles: Record<ColorVariant, { bg: string; text: string }> = {
  pink: {
    bg: "bg-(--primary-bg)",
    text: "text-(--primary)",
  },
  blue: {
    bg: "bg-(--secondary-blue)",
    text: "text-(--secondary-blue-text)",
  },
  green: {
    bg: "bg-(--secondary-green)",
    text: "text-(--secondary-green-text)",
  },
  purple: {
    bg: "bg-(--secondary-purple)",
    text: "text-(--secondary-purple-text)",
  },
  gray: {
    bg: "bg-gray-100",
    text: "text-gray-600",
  },
};

export function QuickActionCard({
  href,
  label,
  icon: Icon,
  variant,
}: QuickActionCardProps) {
  const styles = variantStyles[variant];

  return (
    <Link
      href={href}
      className="bg-white p-5 rounded-[var(--radius-card)] shadow-[var(--shadow-card)] flex flex-col items-center justify-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98]"
    >
      <div
        className={`w-[50px] h-[50px] rounded-2xl flex items-center justify-center ${styles.bg}`}
      >
        <Icon className={`w-6 h-6 ${styles.text}`} />
      </div>
      <span className="text-sm font-semibold text-(--text-main)">{label}</span>
    </Link>
  );
}
