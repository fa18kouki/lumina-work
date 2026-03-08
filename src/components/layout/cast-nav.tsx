"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appSignOut } from "@/lib/auth-helpers";
import { trpc } from "@/lib/trpc";
import { Home, Search, Bot, Bell, MessageCircle, User, LogOut } from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    label: "ホーム",
    icon: Home,
  },
  {
    href: "/stores",
    label: "検索",
    icon: Search,
  },
  {
    href: "/ai-diagnosis",
    label: "AI診断",
    icon: Bot,
  },
  {
    href: "/offers",
    label: "オファー",
    icon: Bell,
    showBadge: true,
  },
  {
    href: "/matches",
    label: "トーク",
    icon: MessageCircle,
  },
  {
    href: "/profile",
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
  const unreadCount = unreadData?.count ?? 0;

  const handleLogout = () => {
    appSignOut("/login");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 md:relative md:border-t-0 md:border-r md:h-screen md:w-64 md:flex md:flex-col md:bg-white md:backdrop-blur-none">
      {/* ロゴ（デスクトップのみ） */}
      <div className="hidden md:block p-4 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/Favicon_16x16.png" alt="" className="w-8 h-8 rounded-lg object-contain" />
          <span className="font-semibold text-gray-900">LUMINA</span>
        </Link>
      </div>

      {/* ナビゲーション項目 */}
      <ul className="flex justify-around h-20 sm:h-[85px] items-center pb-5 md:pb-0 md:h-auto md:flex-col md:p-2 md:space-y-1 md:flex-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/matches" && pathname.startsWith("/chat")) ||
            (item.href === "/offers" && pathname.startsWith("/offers"));
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`
                  relative flex flex-col md:flex-row items-center gap-1 md:gap-3
                  p-2 md:px-4 md:py-3 rounded-lg
                  transition-colors
                  ${
                    isActive
                      ? "text-(--primary) md:bg-(--primary-bg)"
                      : "text-gray-400 hover:text-gray-600 md:hover:bg-gray-50"
                  }
                `}
              >
                <span className="relative">
                  <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                  {item.showBadge && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </span>
                <span className="text-[10px] md:text-sm font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* ログアウトボタン（デスクトップのみ） */}
      <div className="hidden md:block p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">ログアウト</span>
        </button>
      </div>
    </nav>
  );
}
