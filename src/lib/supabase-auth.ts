import { createBrowserClient as createBrowserSupabaseClient } from "@supabase/ssr";
import { createServerClient as createServerSupabaseClient } from "@supabase/ssr";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set"
    );
  }
  return { url, anonKey };
}

/**
 * ブラウザ用Supabase Authクライアント（ログイン/サインアップで使用）
 */
export function createBrowserClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserSupabaseClient(url, anonKey);
}

/**
 * サーバー用Supabase Authクライアント（tRPCコンテキスト/ミドルウェアで使用）
 */
export function createServerClient(cookieStore: ReadonlyRequestCookies) {
  const { url, anonKey } = getSupabaseEnv();
  return createServerSupabaseClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // Server Component からの呼び出し時は set できない
          }
        }
      },
    },
  });
}
