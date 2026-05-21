import { TRPCError } from "@trpc/server";
import { cookies } from "next/headers";

import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionCookie,
} from "@/lib/admin-auth";

import { publicProcedure } from "./trpc";

/**
 * 管理画面 (admin.<host>) 専用 procedure。
 *
 * 認可ロジック:
 *   1. process.env.ADMIN_API_KEY が設定されていること
 *   2. admin-session cookie が存在し、HMAC 署名検証 + 有効期限を満たすこと
 *
 * 既存の `adminProcedure` (Supabase Auth ADMIN role) とは別レイヤ。混同しない。
 */
export const adminPanelProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "ADMIN_API_KEY is not configured on the server",
    });
  }

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = verifyAdminSessionCookie(cookieValue, expected);
  if (!session.ok) {
    // 不正アクセス試行の検出のため失敗を構造化ログに残す。
    // IP は middleware が x-forwarded-for を保持していれば取得可能だが、
    // edge cases に依存しすぎないよう reason だけは確実に出す。
    console.warn("[admin-panel-procedure] auth failed", {
      timestamp: new Date().toISOString(),
      reason: session.reason,
      hasCookie: cookieValue !== undefined,
    });
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "admin login required",
    });
  }

  return next({ ctx });
});
