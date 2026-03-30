"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { OwnerNav } from "@/components/layout/owner-nav";
import { OwnerTopbar } from "@/components/layout/owner-topbar";

export function OwnerLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage =
    pathname === "/o/login" ||
    pathname === "/o/register" ||
    pathname === "/o/forgot-password" ||
    pathname === "/o/reset-password";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <OwnerTopbar />
      <div className="flex flex-1 pt-[70px] min-h-[calc(100vh-70px)]">
        <aside className="hidden md:flex md:w-[260px] md:shrink-0 sticky top-[70px] h-[calc(100vh-70px)]">
          <OwnerNav />
        </aside>
        <main className="flex-1 p-6 md:p-10 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
      {/* モバイル用: 下部ナビ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-[999]">
        <Link
          href="/o/dashboard"
          className="flex flex-col items-center gap-0.5 text-xs text-[var(--text-sub)] hover:text-slate-700"
        >
          ダッシュボード
        </Link>
        <Link
          href="/o/stores"
          className="flex flex-col items-center gap-0.5 text-xs text-[var(--text-sub)] hover:text-slate-700"
        >
          店舗一覧
        </Link>
        <Link
          href="/o/subscription"
          className="flex flex-col items-center gap-0.5 text-xs text-[var(--text-sub)] hover:text-slate-700"
        >
          契約
        </Link>
      </nav>
      <div className="h-16 md:hidden" aria-hidden />
    </div>
  );
}
