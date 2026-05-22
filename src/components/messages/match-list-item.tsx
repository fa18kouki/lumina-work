"use client";

import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";

interface MatchListItemProps {
  href: string;
  name: string;
  subText?: string | null;
  avatarUrl?: string | null;
  updatedAt: Date | string;
  unreadCount?: number;
}

function formatRelativeDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${m}/${d}`;
}

export function MatchListItem({
  href,
  name,
  subText,
  avatarUrl,
  updatedAt,
  unreadCount = 0,
}: MatchListItemProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3 transition-colors hover:bg-gray-50"
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            fill
            className="object-cover"
            sizes="48px"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <MessageCircle className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-gray-900">
            {name}
          </span>
          <span className="shrink-0 text-[11px] text-gray-400">
            {formatRelativeDate(updatedAt)}
          </span>
        </div>
        {subText && (
          <span className="truncate text-xs text-gray-500">{subText}</span>
        )}
      </div>

      {unreadCount > 0 && (
        <span className="ml-1 flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-(--primary) px-1.5 text-[10px] font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
