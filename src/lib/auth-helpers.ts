"use client";

import { useSession as useNextAuthSession, signOut } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-auth";
import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@prisma/client";

/**
 * NextAuth + Supabase 統合セッションフック。
 * NextAuth セッションを優先し、未認証の場合に Supabase セッションをフォールバック確認する。
 * キャストのログインは LINE（NextAuth）とメールOTP（Supabase）の2系統があるため。
 */
export function useAppSession() {
  const { data: nextAuthData, status: nextAuthStatus } = useNextAuthSession();
  const [fallbackData, setFallbackData] = useState<{
    user: { id: string; role: UserRole; email?: string | null };
  } | null>(null);
  const [supabaseChecked, setSupabaseChecked] = useState(false);

  useEffect(() => {
    if (nextAuthStatus === "unauthenticated") {
      const supabase = createBrowserClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          // Supabase OTP でログイン済み → CAST 扱い
          // （Supabase OTP はキャスト用ログインのみで使用される）
          setFallbackData({
            user: { id: user.id, role: "CAST" as UserRole, email: user.email },
          });
        }
        setSupabaseChecked(true);
      });
    } else {
      setSupabaseChecked(true);
    }
  }, [nextAuthStatus]);

  // NextAuth 認証済み → そのまま返す
  if (nextAuthStatus === "authenticated") {
    return { data: nextAuthData, status: "authenticated" as const };
  }

  // まだチェック中
  if (nextAuthStatus === "loading" || !supabaseChecked) {
    return { data: null, status: "loading" as const };
  }

  // Supabase フォールバックセッションあり
  if (fallbackData) {
    return { data: fallbackData, status: "authenticated" as const };
  }

  return { data: null, status: "unauthenticated" as const };
}

/**
 * 店舗向け Supabase Auth セッションフック
 */
export function useStoreSession() {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    const supabase = createBrowserClient();

    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      setStatus(u ? "authenticated" : "unauthenticated");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setStatus(session?.user ? "authenticated" : "unauthenticated");
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, status };
}

/**
 * ログアウト処理（NextAuth用）
 */
export async function appSignOut(redirectUrl = "/") {
  await signOut({ callbackUrl: redirectUrl });
}

/**
 * 店舗ログアウト処理（Supabase Auth用）
 */
export function useStoreSignOut() {
  const router = useRouter();

  return useCallback(async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push("/s/login");
    router.refresh();
  }, [router]);
}
