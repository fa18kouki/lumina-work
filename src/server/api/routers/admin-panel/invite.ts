import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  AdminOwnerInviteEmail,
  buildAdminOwnerInviteSubject,
  buildAdminOwnerInviteText,
} from "@/emails/admin-owner-invite";
import { EMAIL_FROM, getResend } from "@/lib/resend";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { adminPanelProcedure } from "@/server/api/admin-panel-procedure";
import { createTRPCRouter } from "@/server/api/trpc";

const emailSchema = z.string().email().max(320);

const listInput = z
  .object({
    status: z.enum(["PENDING", "ACCEPTED", "REVOKED"]).optional(),
    take: z.number().int().min(1).max(200).default(100),
  })
  .default({ take: 100 });

function getInviteRedirectTo(): string | undefined {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!base) return undefined;
  // Supabase の招待リンクは implicit flow なので access_token を URL fragment
  // (#access_token=...&type=invite) に載せて戻ってくる。サーバ側の
  // /api/auth/callback は ?code= (PKCE) しか拾えず一度 missing_code に弾かれるため、
  // hash を読めるクライアントページである /o/login に直接着地させ、そこで
  // supabase.auth.setSession → /api/auth/sync-owner-user で Prisma 上の
  // User / Owner / Subscription provisioning + AdminInvitation 受諾マークを実行する。
  return `${base.replace(/\/$/, "")}/o/login`;
}

/**
 * Supabase の invite action link を発行する。
 *
 * 設計メモ:
 *   - admin の `inviteUserByEmail` ではなく `generateLink({ type: 'invite' })` を使う。
 *   - `inviteUserByEmail` は (a) 既存 user に対して "already been registered" で失敗する
 *     ので resend 用途に使えない、(b) Supabase 側で自動メール送信する経路で、
 *     メール文面を Supabase ダッシュボードに依存してしまう。
 *   - `generateLink({ type: 'invite' })` は新規/既存ユーザーを問わず invite link を返し、
 *     かつ admin API としては link 生成のみで自動メール送信は行わない (= 文面が二重送信
 *     にならない)。メールは下の `sendInviteEmailViaResend` で Resend 経由で送る。
 */
async function issueSupabaseInviteLink(email: string) {
  const supabase = getSupabaseAdminClient();
  const redirectTo = getInviteRedirectTo();
  return supabase.auth.admin.generateLink({
    type: "invite",
    email,
    options: redirectTo ? { redirectTo } : undefined,
  });
}

/**
 * 招待メールを Resend 経由で送る。テンプレートは `src/emails/admin-owner-invite.tsx`。
 */
async function sendInviteEmailViaResend(email: string, url: string) {
  const resend = getResend();
  return resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: buildAdminOwnerInviteSubject(),
    react: AdminOwnerInviteEmail({ url }),
    text: buildAdminOwnerInviteText(url),
  });
}

export const adminInviteRouter = createTRPCRouter({
  list: adminPanelProcedure.input(listInput).query(async ({ input, ctx }) => {
    return ctx.prisma.adminInvitation.findMany({
      where: input.status ? { status: input.status } : undefined,
      orderBy: { createdAt: "desc" },
      take: input.take,
    });
  }),

  create: adminPanelProcedure
    .input(z.object({ email: emailSchema }))
    .mutation(async ({ input, ctx }) => {
      // ① まず DB を原子的に "PENDING" でクレーム。
      //   同 email への並列リクエストが来ても、$transaction 内で findUnique → upsert を
      //   完結させることで Supabase API を 1 度しか叩かない (= 重複メール送信防止)。
      //   既に PENDING/ACCEPTED の行があれば claim 失敗扱いで CONFLICT を返す。
      const claim = await ctx.prisma.$transaction(async (tx) => {
        const existing = await tx.adminInvitation.findUnique({
          where: { email: input.email },
        });
        if (existing && existing.status !== "REVOKED") {
          return { kind: "conflict" as const };
        }
        const now = new Date();
        const claimed = await tx.adminInvitation.upsert({
          where: { email: input.email },
          // 監査ログとしての一貫性のため createdAt は維持。
          update: {
            status: "PENDING",
            invitedByLabel: "admin",
            lastSentAt: now,
            acceptedAt: null,
            revokedAt: null,
            supabaseUserId: null,
          },
          create: {
            email: input.email,
            status: "PENDING",
            invitedByLabel: "admin",
            lastSentAt: now,
          },
        });
        return { kind: "claimed" as const, invitation: claimed };
      });

      if (claim.kind === "conflict") {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "この email にはすでに招待が存在します。再送が必要な場合は再送機能を使ってください。",
        });
      }

      // ② Supabase で invite link を発行 (外部 API なので transaction 外)。
      const linkResult = await issueSupabaseInviteLink(input.email);
      if (linkResult.error || !linkResult.data?.properties?.action_link) {
        await rollbackClaimToRevoked({
          ctx,
          claim,
          email: input.email,
          supabaseErrorMessage:
            linkResult.error?.message ?? "no action_link in response",
          phase: "generateLink",
        });
      }
      // ↑ rollback ヘルパは throw するので、ここに辿り着いた時点で error は無いが
      // TS narrowing 用に再チェック。
      if (linkResult.error || !linkResult.data?.properties?.action_link) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "unreachable: rollback should have thrown",
        });
      }
      const actionLink = linkResult.data.properties.action_link;
      const supabaseUserId = linkResult.data.user?.id ?? null;

      // ③ 招待メールを Resend で送る。失敗したら claim を REVOKED に戻す。
      //   この時点で Supabase 側には auth user 行が既に作られているが、それは
      //   resend で次に再発行できるので REVOKED ロールバックでも整合は取れる。
      const sendResult = await sendInviteEmailViaResend(input.email, actionLink);
      if (sendResult.error) {
        await rollbackClaimToRevoked({
          ctx,
          claim,
          email: input.email,
          supabaseErrorMessage: sendResult.error.message,
          phase: "resend.send",
        });
      }

      // ④ supabaseUserId を紐付け。
      if (supabaseUserId && supabaseUserId !== claim.invitation.supabaseUserId) {
        await ctx.prisma.adminInvitation.update({
          where: { id: claim.invitation.id },
          data: { supabaseUserId },
        });
      }
      // 戻り値は claim 時点の行 + 紐付け済の supabaseUserId を merge して返す。
      return { ...claim.invitation, supabaseUserId };
    }),

  resend: adminPanelProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const invitation = await ctx.prisma.adminInvitation.findUnique({
        where: { id: input.id },
      });
      if (!invitation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (invitation.status === "ACCEPTED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "受諾済みの招待は再送できません",
        });
      }

      // 再送先 user の状態は次の 2 パターン:
      //   (a) 既に auth.users に行がある (= 過去に invite 済みで未受諾、典型ケース)
      //   (b) 何らかの理由で auth.users 行が消えている (REVOKED から create で復活、等)
      // generateLink({ type: 'invite' }) は両ケースで invite link を返してくれる。
      const linkResult = await issueSupabaseInviteLink(invitation.email);
      if (linkResult.error || !linkResult.data?.properties?.action_link) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Supabase resend failed: ${
            linkResult.error?.message ?? "no action_link in response"
          }`,
        });
      }
      const actionLink = linkResult.data.properties.action_link;
      const newSupabaseUserId = linkResult.data.user?.id ?? null;

      // Resend で送信。失敗したら DB は更新せず、エラーを返す (現状の lastSentAt も
      // 維持される = 「再送に失敗した」が監査ログ上は不可視だが、これは create と違い
      // claim 行が残るだけなので致命ではない)。
      const sendResult = await sendInviteEmailViaResend(
        invitation.email,
        actionLink,
      );
      if (sendResult.error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Resend send failed: ${sendResult.error.message}`,
        });
      }

      // generateLink の戻りに含まれる user.id を、DB 側で空 or 不一致なら更新しておく
      // (REVOKED → 再 create の経路や、Supabase 側で行が作り直されたケースに備える)。
      const shouldUpdateSupabaseUserId =
        newSupabaseUserId !== null &&
        newSupabaseUserId !== invitation.supabaseUserId;

      return ctx.prisma.adminInvitation.update({
        where: { id: input.id },
        data: {
          status: "PENDING",
          lastSentAt: new Date(),
          revokedAt: null,
          ...(shouldUpdateSupabaseUserId
            ? { supabaseUserId: newSupabaseUserId }
            : {}),
        },
      });
    }),

  revoke: adminPanelProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      // ① 早期 NOT_FOUND と supabaseUserId の取得を兼ねた pre-check。
      //   ここで status === ACCEPTED でも以下の updateMany が条件で弾くので
      //   主たる権威は updateMany の count にする。
      const pre = await ctx.prisma.adminInvitation.findUnique({
        where: { id: input.id },
        select: { id: true, status: true, supabaseUserId: true },
      });
      if (!pre) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (pre.status === "ACCEPTED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "受諾済みの招待は失効できません",
        });
      }

      // ② TOCTOU 対策: pre-check と本更新の間に accept が走り込んでも
      //   レースで負けるよう「status != ACCEPTED の場合のみ REVOKED」を
      //   1 クエリで atomic に行う。count === 0 は accept が先勝ちした証拠。
      //   この場合 Supabase 側 deleteUser を呼ばない (= 受諾済みユーザーを
      //   誤って削除しない安全側に倒す)。
      const updated = await ctx.prisma.adminInvitation.updateMany({
        where: { id: input.id, status: { not: "ACCEPTED" } },
        data: { status: "REVOKED", revokedAt: new Date() },
      });
      if (updated.count === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "受諾済みの招待は失効できません (revoke 試行中に承諾されました)",
        });
      }

      // ③ DB は REVOKED でコミット済なので、Supabase 側 user を消す。
      //   ここでの失敗は DB を戻さない: 戻すと「revoke 試行 → 失敗 →
      //   invitation 復活 → user が再ログイン可」と整合が崩れる。
      //   構造化ログを残してオペレーターが手動清掃する運用にする。
      if (pre.supabaseUserId) {
        const supabase = getSupabaseAdminClient();
        const { error } = await supabase.auth.admin.deleteUser(
          pre.supabaseUserId,
        );
        if (error && error.status !== 404) {
          console.error(
            "[admin-panel.invite.revoke] supabase deleteUser failed",
            {
              timestamp: new Date().toISOString(),
              invitationId: input.id,
              supabaseUserId: pre.supabaseUserId,
              supabaseError: error.message,
            },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Supabase deleteUser failed: ${error.message} (invitation is already REVOKED in DB; supabase user may need manual cleanup)`,
          });
        }
      }

      return ctx.prisma.adminInvitation.findUniqueOrThrow({
        where: { id: input.id },
      });
    }),
});

// ---- create 用 rollback ヘルパ ---------------------------------------------

interface RollbackArgs {
  ctx: { prisma: typeof import("@/server/db").prisma };
  claim: { kind: "claimed"; invitation: { id: string; supabaseUserId: string | null } };
  email: string;
  supabaseErrorMessage: string;
  phase: "generateLink" | "resend.send";
}

/**
 * create のフロー中で claim を上書きした後に Supabase or Resend が失敗した場合の
 * 共通ロールバック。常に TRPCError を throw する (戻り値は型上 never)。
 */
async function rollbackClaimToRevoked(args: RollbackArgs): Promise<never> {
  const { ctx, claim, email, supabaseErrorMessage, phase } = args;
  let rollbackFailure: unknown = null;
  try {
    await ctx.prisma.adminInvitation.update({
      where: { id: claim.invitation.id },
      data: { status: "REVOKED", revokedAt: new Date() },
    });
  } catch (rollbackError) {
    rollbackFailure = rollbackError;
    console.error("[admin-panel.invite.create] rollback failed", {
      timestamp: new Date().toISOString(),
      invitationId: claim.invitation.id,
      email,
      phase,
      supabaseError: supabaseErrorMessage,
      rollbackError:
        rollbackError instanceof Error
          ? rollbackError.message
          : String(rollbackError),
    });
  }
  const rollbackSuffix = rollbackFailure
    ? ` (rollback also failed: ${
        rollbackFailure instanceof Error
          ? rollbackFailure.message
          : String(rollbackFailure)
      }; invitation id=${claim.invitation.id} may be left PENDING — manual cleanup required)`
    : "";
  const prefix =
    phase === "generateLink" ? "Supabase invite failed" : "Resend send failed";
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: `${prefix}: ${supabaseErrorMessage}${rollbackSuffix}`,
  });
}
