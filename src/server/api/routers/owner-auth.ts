import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  issueOwnerRecoveryLink,
  issueOwnerSignupLink,
  sendOwnerPasswordResetEmail,
  sendOwnerSignupConfirmEmail,
} from "@/server/auth/owner-email";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

const emailSchema = z.string().email().max(320);
// 既存 /o/register page でも 8 文字以上を要求。72 上限は bcrypt 互換性。
const passwordSchema = z.string().min(8).max(72);
// 既存 referral コードフォーマット (LUMINA-XXXXXX 等)。空文字は許容しない。
const referralCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Z0-9-]+$/i)
  .optional();

function getRedirectBase(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!base) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "NEXT_PUBLIC_APP_URL is not configured",
    });
  }
  return base.replace(/\/$/, "");
}

/**
 * signup 用の redirectTo URL を組み立てる。
 *
 * 既存 /o/register が `/api/auth/callback?next=/o/dashboard&ref=...` を使っており、
 * `/api/auth/callback` は session を確立した上で Prisma user を作成し referral を
 * 拾うので、その経路を維持する (= referral 機能を温存)。
 */
function buildOwnerSignupRedirectTo(referralCode?: string): string {
  const base = getRedirectBase();
  const next = "/o/dashboard";
  const refQuery = referralCode
    ? `&ref=${encodeURIComponent(referralCode.toUpperCase())}`
    : "";
  return `${base}/api/auth/callback?next=${encodeURIComponent(next)}${refQuery}`;
}

/**
 * Owner 向け auth フローの mutation。
 *
 * 設計メモ:
 *   - これらは未認証で叩かれる publicProcedure 扱い。
 *   - Supabase Auth `admin.generateLink` は service_role 鍵で叩くため、必ず server で呼ぶ。
 *   - メール送信は Resend SDK で自前テンプレート (Supabase ダッシュボードの Email
 *     Templates には依存しない)。`src/server/auth/owner-email.ts` を参照。
 *   - レート制限は今のところ Supabase Auth API の内部 rate limit と Resend の rate limit に
 *     依存。アプリ層でも追加したくなったら upstash/ratelimit などを別 issue で導入する。
 */
export const ownerAuthRouter = createTRPCRouter({
  /**
   * Owner 自己登録 (signup) を開始する。
   *
   * 流れ:
   *   1. `admin.generateLink({ type: 'signup' })` で auth user を作成 + 確認 link を取得
   *   2. 取得した link を Resend で送信 (テンプレ `src/emails/owner-signup-confirm.tsx`)
   *   3. UI 側は emailSent = true 状態に遷移し、ユーザーがメールから戻ってくるのを待つ
   *
   * 既存登録済みの email は CONFLICT を返す (UX 上「既に登録済」のシグナルは必要)。
   * メール送信失敗は INTERNAL_SERVER_ERROR (auth.users 行は残るが、次回 generateLink で
   * 冪等に再発行される)。
   */
  requestSignup: publicProcedure
    .input(
      z.object({
        email: emailSchema,
        password: passwordSchema,
        referralCode: referralCodeSchema,
      }),
    )
    .mutation(async ({ input }) => {
      const redirectTo = buildOwnerSignupRedirectTo(input.referralCode);
      const linkResult = await issueOwnerSignupLink(input.email, input.password, {
        redirectToOverride: redirectTo,
      });

      if (!linkResult.ok) {
        const message = linkResult.error.message;
        const lower = message.toLowerCase();
        if (
          lower.includes("already") ||
          lower.includes("registered") ||
          lower.includes("exists")
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "このメールアドレスはすでに登録されています",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Supabase signup failed: ${message}`,
        });
      }

      const sendResult = await sendOwnerSignupConfirmEmail(
        input.email,
        linkResult.value.actionLink,
      );
      if (!sendResult.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Resend send failed: ${sendResult.errorMessage}`,
        });
      }

      return { ok: true as const };
    }),

  /**
   * Owner パスワードリセットを開始する。
   *
   * email enumeration 防止のため、存在しない email でも基本的に成功として扱う
   * (= 「リセットメールを送信しました」を返す)。内部の Supabase / Resend エラーは
   * 構造化ログに残しつつ UI には透明にする。
   *
   * ただし Resend 自体が落ちる等の **アプリ内部障害** は INTERNAL_SERVER_ERROR で返す
   * (これは email の有無情報ではないので enumeration リスクが無い)。
   */
  requestPasswordReset: publicProcedure
    .input(z.object({ email: emailSchema }))
    .mutation(async ({ input }) => {
      const linkResult = await issueOwnerRecoveryLink(input.email);

      if (!linkResult.ok) {
        const lower = linkResult.error.message.toLowerCase();
        // "User not found" / "Email not confirmed" 系は enumeration リスクがあるので
        // success のフリをする。それ以外 (rate limit / network / config 等) は素直にエラー。
        const isEnumerationLeak =
          lower.includes("not found") ||
          lower.includes("no user") ||
          lower.includes("not confirmed");
        if (isEnumerationLeak) {
          console.warn(
            "[owner-auth.requestPasswordReset] silently succeeding to prevent email enumeration",
            {
              timestamp: new Date().toISOString(),
              supabaseError: linkResult.error.message,
            },
          );
          return { ok: true as const };
        }
        console.error("[owner-auth.requestPasswordReset] generateLink failed", {
          timestamp: new Date().toISOString(),
          supabaseError: linkResult.error.message,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Supabase recovery failed: ${linkResult.error.message}`,
        });
      }

      const sendResult = await sendOwnerPasswordResetEmail(
        input.email,
        linkResult.value.actionLink,
      );
      if (!sendResult.ok) {
        console.error("[owner-auth.requestPasswordReset] resend send failed", {
          timestamp: new Date().toISOString(),
          resendError: sendResult.errorMessage,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Resend send failed: ${sendResult.errorMessage}`,
        });
      }

      return { ok: true as const };
    }),
});
