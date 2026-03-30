"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export function FixedCTA() {
  const { data: session } = useSession();

  const isLoggedIn = !!session;
  const isStore = session?.user?.role === "OWNER";

  const href = isLoggedIn ? (isStore ? "/o/dashboard" : "/c/dashboard") : "/diagnosis";

  const label = isLoggedIn
    ? isStore
      ? "管理画面へ"
      : "マイページへ"
    : "今すぐ無料で診断をはじめる";

  const sublabel = isLoggedIn
    ? `${session?.user?.name ?? (isStore ? "店舗" : "キャスト")}としてログイン中`
    : "あなたに合う時給の目安をチェック";

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-white via-white/95 to-transparent pb-3 pt-10 md:pb-4">
      <div className="pointer-events-auto mx-auto max-w-2xl px-4">
        <Link
          href={href}
          className="flex w-full items-center justify-between gap-3 rounded-2xl bg-pink-500 px-5 py-3.5 font-bold text-white shadow-[0_12px_40px_-8px_rgba(236,72,153,0.45)] transition hover:bg-pink-600 active:scale-[0.99] md:px-6 md:py-4"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
              {isLoggedIn ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
            </span>
            <div className="min-w-0 text-left">
              <p className="truncate text-xs font-medium text-pink-100">{sublabel}</p>
              <p className="truncate text-sm md:text-base">{label}</p>
            </div>
          </div>
          <svg className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
