import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase Service Role クライアント。auth.admin.* 系を叩く用途で使う。
 *
 * 使用上の注意:
 *   - SUPABASE_ROLE_KEY は **全権** のキーで、RLS を完全にバイパスする。
 *     必ずサーバ側 (Route Handler / tRPC procedure) からのみ呼ぶこと。
 *   - 管理画面の `adminPanelProcedure` (admin-session cookie 検証つき) からのみ呼び出す想定。
 *   - 環境ごとに別のキー (dev / production) を使う。NEXT_PUBLIC_SUPABASE_URL が
 *     対応する Supabase プロジェクトの URL であることを Vercel env scope で担保する。
 */

let cached: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ROLE_KEY must be configured",
    );
  }
  cached = createClient(url, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return cached;
}

/** テスト目的のクライアントキャッシュ初期化。本番コードから呼ばない。 */
export function _resetSupabaseAdminClientCache() {
  cached = null;
}
