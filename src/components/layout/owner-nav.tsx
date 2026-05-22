"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  MessageCircle,
  CreditCard,
  Receipt,
  Settings,
  LogOut,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useOwnerSignOut } from "@/lib/auth-helpers";

const navItems = [
  { href: "/o/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/o/stores", label: "店舗一覧", icon: Store },
  {
    href: "/o/messages",
    label: "メッセージ",
    icon: MessageCircle,
    showMessageBadge: true,
  },
  { href: "/o/subscription", label: "契約・プラン", icon: CreditCard },
  { href: "/o/billing", label: "請求・履歴", icon: Receipt },
];

export function OwnerNav() {
  const pathname = usePathname();
  const ownerSignOut = useOwnerSignOut();
  const { data: messageUnreadData } = trpc.message.getUnreadCount.useQuery(
    undefined,
    { refetchInterval: 20_000 }
  );
  const messageUnreadCount = messageUnreadData?.count ?? 0;

  return (
    <nav className="w-[220px] lg:w-[260px] bg-white h-full flex flex-col gap-2.5 py-8 px-4 lg:px-5 border-r border-[#EAEAEA] shrink-0">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname?.startsWith(item.href + "/");
        const Icon = item.icon;
        const showBadge = item.showMessageBadge && messageUnreadCount > 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={`
              flex items-center gap-4 px-5 py-3.5 rounded-md font-medium text-sm transition-all
              ${isActive ? "bg-slate-100 text-slate-900 font-bold" : "text-[var(--text-sub)] hover:bg-slate-50 hover:text-slate-700"}
            `}
          >
            <Icon className="w-5 h-5 shrink-0" aria-hidden />
            <span className="flex-1">{item.label}</span>
            {showBadge && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {messageUnreadCount > 9 ? "9+" : messageUnreadCount}
              </span>
            )}
          </Link>
        );
      })}

      <div className="mt-auto pt-2">
        <Link
          href="/o/settings"
          prefetch={false}
          className={`
            flex items-center gap-4 px-5 py-3.5 rounded-md font-medium text-sm transition-all
            ${pathname === "/o/settings" ? "bg-slate-100 text-slate-900 font-bold" : "text-[var(--text-sub)] hover:bg-slate-50 hover:text-slate-700"}
          `}
        >
          <Settings className="w-5 h-5 shrink-0" aria-hidden />
          設定
        </Link>
        <button
          onClick={() => ownerSignOut()}
          className="flex items-center gap-4 w-full px-5 py-3.5 rounded-md font-medium text-sm text-[var(--text-sub)] hover:bg-slate-50 hover:text-slate-700 transition-all"
        >
          <LogOut className="w-5 h-5 shrink-0" aria-hidden />
          ログアウト
        </button>
      </div>
    </nav>
  );
}
