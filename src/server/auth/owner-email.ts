/**
 * Owner 経路の認証メール送信を一手に引き受ける共通モジュール。
 *
 * 方針 (`docs/email-architecture.md` を参照):
 *   - Owner の認証経路は Supabase Auth + Resend SDK 直送。
 *     Supabase に `auth.admin.generateLink` でリンクだけ発行させ、メール送信は
 *     Resend で自前テンプレートを使う。Supabase ダッシュボードの Email Templates
 *     には依存しない (= 文面の管理がコードベースで完結する)。
 *   - 対応する Owner 経路は 3 つ: 招待 (admin による) / 自己登録確認 / パスワードリセット。
 *
 * 注意:
 *   - Cast 経路はこのモジュールを使わない。Cast は NextAuth (LINE / Twitter /
 *     Email Provider via Resend) を経由する (`src/lib/auth.ts`,
 *     `src/lib/auth-resend-provider.ts`)。
 *   - 通知メール (offer-received / interview-scheduled 等) は
 *     `src/server/notifications/channels/email.tsx` を経由する (これも Resend SDK 直送
 *     だが、auth 経路とは別レイヤー)。
 */

import {
  OwnerInviteEmail,
  buildOwnerInviteSubject,
  buildOwnerInviteText,
} from "@/emails/owner-invite";
import {
  OwnerPasswordResetEmail,
  buildOwnerPasswordResetSubject,
  buildOwnerPasswordResetText,
} from "@/emails/owner-password-reset";
import {
  OwnerSignupConfirmEmail,
  buildOwnerSignupConfirmSubject,
  buildOwnerSignupConfirmText,
} from "@/emails/owner-signup-confirm";
import { getEmailFrom, getResend } from "@/lib/resend";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

// ---- リダイレクト URL の組み立て ----------------------------------------

/**
 * Supabase invite/signup リンクから戻ってくる先 (= owner login ページ)。
 * `/o/login` は implicit flow の hash fragment (`#access_token=...`) を読んで
 * supabase.auth.setSession → /api/auth/sync-owner-user を呼ぶクライアントページ。
 */
function getOwnerLoginRedirectTo(): string | undefined {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!base) return undefined;
  return `${base.replace(/\/$/, "")}/o/login`;
}

/**
 * パスワードリセットリンクから戻ってくる先 (= password 再設定ページ)。
 * `/o/reset-password` は token を受け取って supabase.auth.updateUser({ password })
 * を呼ぶクライアントページ。
 */
function getOwnerResetPasswordRedirectTo(): string | undefined {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!base) return undefined;
  return `${base.replace(/\/$/, "")}/o/reset-password`;
}

// ---- Supabase generateLink のラッパ ---------------------------------------

export interface OwnerLinkSuccess {
  actionLink: string;
  supabaseUserId: string | null;
}

export interface OwnerLinkFailure {
  message: string;
}

export type OwnerLinkResult =
  | { ok: true; value: OwnerLinkSuccess }
  | { ok: false; error: OwnerLinkFailure };

export interface IssueLinkOptions {
  /**
   * Supabase の confirm/recovery link 経由でリダイレクトする先を上書きする。
   * referral code やクエリパラメータを保持したい場合に呼び出し側で組み立てる。
   * default:
   *   invite / signup → `${NEXT_PUBLIC_APP_URL}/o/login`
   *   recovery        → `${NEXT_PUBLIC_APP_URL}/o/reset-password`
   */
  redirectToOverride?: string;
}

/**
 * admin 招待リンクを発行する。
 * `inviteUserByEmail` は既存 user に対して "already been registered" で落ちるが、
 * `generateLink({ type: 'invite' })` は新規/既存どちらでも invite link を返す。
 */
export async function issueOwnerInviteLink(
  email: string,
  options?: IssueLinkOptions,
): Promise<OwnerLinkResult> {
  const supabase = getSupabaseAdminClient();
  const redirectTo = options?.redirectToOverride ?? getOwnerLoginRedirectTo();
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "invite",
    email,
    options: redirectTo ? { redirectTo } : undefined,
  });
  return normalizeLinkResult(data, error);
}

/**
 * 自己登録 (signup) の確認リンクを発行する。
 * `generateLink({ type: 'signup' })` は password 必須で、新規 user 作成 + 確認 link 取得を
 * 同時に行う。既存未確認 email に対しても新しい link を返す。
 */
export async function issueOwnerSignupLink(
  email: string,
  password: string,
  options?: IssueLinkOptions,
): Promise<OwnerLinkResult> {
  const supabase = getSupabaseAdminClient();
  const redirectTo = options?.redirectToOverride ?? getOwnerLoginRedirectTo();
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: redirectTo ? { redirectTo } : undefined,
  });
  return normalizeLinkResult(data, error);
}

/**
 * パスワードリセット (recovery) リンクを発行する。
 * 存在しない email の場合 Supabase が "User not found" を返す。enumeration 防止
 * のため、呼び出し側はこのエラーを「成功と区別しない」ハンドリングを推奨する。
 */
export async function issueOwnerRecoveryLink(
  email: string,
  options?: IssueLinkOptions,
): Promise<OwnerLinkResult> {
  const supabase = getSupabaseAdminClient();
  const redirectTo =
    options?.redirectToOverride ?? getOwnerResetPasswordRedirectTo();
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
    options: redirectTo ? { redirectTo } : undefined,
  });
  return normalizeLinkResult(data, error);
}

function normalizeLinkResult(
  data: Awaited<
    ReturnType<
      ReturnType<typeof getSupabaseAdminClient>["auth"]["admin"]["generateLink"]
    >
  >["data"],
  error: Awaited<
    ReturnType<
      ReturnType<typeof getSupabaseAdminClient>["auth"]["admin"]["generateLink"]
    >
  >["error"],
): OwnerLinkResult {
  if (error) {
    return { ok: false, error: { message: error.message } };
  }
  const actionLink = data?.properties?.action_link;
  if (!actionLink) {
    return {
      ok: false,
      error: { message: "Supabase generateLink returned no action_link" },
    };
  }
  return {
    ok: true,
    value: {
      actionLink,
      supabaseUserId: data.user?.id ?? null,
    },
  };
}

// ---- Resend SDK 経由のメール送信 ------------------------------------------

export interface OwnerSendResult {
  ok: boolean;
  errorMessage?: string;
}

async function sendViaResend(
  email: string,
  subject: string,
  reactElement: React.ReactElement,
  text: string,
): Promise<OwnerSendResult> {
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: getEmailFrom(),
    to: email,
    subject,
    react: reactElement,
    text,
  });
  if (error) {
    return { ok: false, errorMessage: error.message };
  }
  return { ok: true };
}

export function sendOwnerInviteEmail(
  email: string,
  url: string,
): Promise<OwnerSendResult> {
  return sendViaResend(
    email,
    buildOwnerInviteSubject(),
    OwnerInviteEmail({ url }),
    buildOwnerInviteText(url),
  );
}

export function sendOwnerSignupConfirmEmail(
  email: string,
  url: string,
): Promise<OwnerSendResult> {
  return sendViaResend(
    email,
    buildOwnerSignupConfirmSubject(),
    OwnerSignupConfirmEmail({ url }),
    buildOwnerSignupConfirmText(url),
  );
}

export function sendOwnerPasswordResetEmail(
  email: string,
  url: string,
): Promise<OwnerSendResult> {
  return sendViaResend(
    email,
    buildOwnerPasswordResetSubject(),
    OwnerPasswordResetEmail({ url }),
    buildOwnerPasswordResetText(url),
  );
}
