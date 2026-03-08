"use client";

import { useSession as useNextAuthSession, signOut } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-auth";
import type { User } from "@supabase/supabase-js";

/**
 * NextAuth の useSession をラップするフック。
 */
export function useAppSession() {
  const { data, status } = useNextAuthSession();
  return { data, status };
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
    router.push("/store/login");
    router.refresh();
  }, [router]);
}
