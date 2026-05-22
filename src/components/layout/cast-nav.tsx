"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Home, Search, Bell, MessageCircle, User } from "lucide-react";

const navItems = [
  {
    href: "/c/dashboard",
    label: "ホーム",
    icon: Home,
  },
  {
    href: "/c/stores",
    label: "検索",
    icon: Search,
  },
  {
    href: "/c/offers",
    label: "オファー",
    icon: Bell,
    showOfferBadge: true,
  },
  {
    href: "/c/messages",
    label: "メッセージ",
    icon: MessageCircle,
    showMessageBadge: true,
  },
  {
    href: "/c/profile/edit",
    label: "マイページ",
    icon: User,
  },
];

export function CastNav() {
  const pathname = usePathname();

  const { data: unreadData } = trpc.notification.getUnreadCount.useQuery(
    undefined,
    { refetchInterval: 30_000 }
  );
  const { data: messageUnreadData } = trpc.message.getUnreadCount.useQuery(
    undefined,
    { refetchInterval: 20_000 }
  );
  const offerUnreadCount = unreadData?.count ?? 0;
  const messageUnreadCount = messageUnreadData?.count ?? 0;

  return (
    <nav className="sticky bottom-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100">
      {/* ナビゲーション項目 */}
      <ul className="flex justify-around h-20 sm:h-[85px] items-center pb-5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/c/offers" && pathname.startsWith("/c/offers")) ||
            (item.href === "/c/messages" && pathname.startsWith("/c/messages"));
          const Icon = item.icon;
          const badgeCount = item.showOfferBadge
            ? offerUnreadCount
            : item.showMessageBadge
              ? messageUnreadCount
              : 0;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`
                  relative flex flex-col items-center gap-1
                  p-2 rounded-xl
                  transition-colors
                  ${
                    isActive
                      ? "text-(--primary)"
                      : "text-gray-400 hover:text-gray-600"
                  }
                `}
              >
                <span className="relative">
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  {badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5">
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
