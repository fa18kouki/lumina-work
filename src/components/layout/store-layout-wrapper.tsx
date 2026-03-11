"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { StoreNav } from "@/components/layout/store-nav";
import { StoreTopbar } from "@/components/layout/store-topbar";
import { OnboardingModal } from "@/components/store/onboarding-modal";
import { useDemoSession } from "@/lib/demo-session";
import { trpc } from "@/lib/trpc";

function OnboardingGuard() {
  const [dismissed, setDismissed] = useState(false);
  const { session: demoSession } = useDemoSession();
  const { data: profile, isLoading } = trpc.store.getProfile.useQuery(
    undefined,
    { enabled: !demoSession },
  );

  if (demoSession || dismissed || isLoading) return null;
  if (profile?.name && profile?.area && profile?.address) return null;

  return <OnboardingModal onComplete={() => setDismissed(true)} />;
}

export function StoreLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage =
    pathname === "/s/login" ||
    pathname === "/s/register" ||
    pathname === "/s/forgot-password" ||
    pathname === "/s/reset-password";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <StoreTopbar />
      <OnboardingGuard />
      <div className="flex flex-1 pt-[70px] min-h-[calc(100vh-70px)]">
        <aside className="hidden md:flex md:w-[260px] md:shrink-0 sticky top-[70px] h-[calc(100vh-70px)]">
          <StoreNav />
        </aside>
        <main className="flex-1 p-6 md:p-10 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
      {/* モバイル用: 下部ナビ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-[999]">
        <Link
          href="/s/dashboard"
          className="flex flex-col items-center gap-0.5 text-xs text-[var(--text-sub)] hover:text-slate-700"
        >
          ダッシュボード
        </Link>
        <Link
          href="/s/casts"
          className="flex flex-col items-center gap-0.5 text-xs text-[var(--text-sub)] hover:text-slate-700"
        >
          応募者
        </Link>
        <Link
          href="/s/profile"
          className="flex flex-col items-center gap-0.5 text-xs text-[var(--text-sub)] hover:text-slate-700"
        >
          店舗
        </Link>
      </nav>
      <div className="h-16 md:hidden" aria-hidden />
    </div>
  );
}
