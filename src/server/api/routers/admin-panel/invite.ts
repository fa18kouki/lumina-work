import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { adminPanelProcedure } from "@/server/api/admin-panel-procedure";
import { createTRPCRouter } from "@/server/api/trpc";
import {
  issueOwnerInviteLink,
  sendOwnerInviteEmail,
} from "@/server/auth/owner-email";

const emailSchema = z.string().email().max(320);

const listInput = z
  .object({
    status: z.enum(["PENDING", "ACCEPTED", "REVOKED"]).optional(),
    take: z.number().int().min(1).max(200).default(100),
  })
  .default({ take: 100 });

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
      //   さらに、`/o/register` 等の自己登録経由で既に User として存在する email も
      //   弾く: Supabase 側は inviteUserByEmail を冪等に扱ってしまうため、
      //   AdminInvitation 行が無い "self-registered owner" に誤って招待メールが
      //   再送される事故を防ぐためにここで DB 検証する。
      const claim = await ctx.prisma.$transaction(async (tx) => {
        const existingUser = await tx.user.findFirst({
          where: { email: input.email, deletedAt: null },
          select: { id: true, role: true },
        });
        if (existingUser) {
          return {
            kind: "user-conflict" as const,
            role: existingUser.role,
          };
        }
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

      if (claim.kind === "user-conflict") {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            claim.role === "OWNER"
              ? "このメールアドレスはすでにオーナーアカウントとして登録されているため招待できません。"
              : "このメールアドレスは別の役割 (キャスト等) で登録済みのため、オーナー招待できません。",
        });
      }

      // ② Supabase で invite link を発行 (外部 API なので transaction 外)。
      //   `issueOwnerInviteLink` は `generateLink({ type: 'invite' })` 経由で、新規/既存
      //   どちらの email でも link を返す (`inviteUserByEmail` と違って既存 user で落ちない)。
      const linkResult = await issueOwnerInviteLink(input.email);
      if (!linkResult.ok) {
        await rollbackClaimToRevoked({
          ctx,
          claim,
          email: input.email,
          errorMessage: linkResult.error.message,
          phase: "generateLink",
        });
      }
      if (!linkResult.ok) {
        // rollbackClaimToRevoked は throw するので unreachable だが TS narrowing 用
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "unreachable: rollback should have thrown",
        });
      }
      const { actionLink, supabaseUserId } = linkResult.value;

      // ③ 招待メールを Resend SDK 経由で送る。失敗したら claim を REVOKED に戻す。
      //   Supabase 側に auth user 行は既に作られているが、resend で次に再発行できるため
      //   整合は取れる。
      const sendResult = await sendOwnerInviteEmail(input.email, actionLink);
      if (!sendResult.ok) {
        await rollbackClaimToRevoked({
          ctx,
          claim,
          email: input.email,
          errorMessage: sendResult.errorMessage ?? "unknown resend error",
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
      return { ...claim.invitation, supabaseUserId };
    }),

  resend: adminPanelProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      // ① pre-check: NOT_FOUND の早期検出と email 取得用。
      //   status は updateMany の条件で再評価するので、ここでの ACCEPTED チェックは
      //   早期エラー UX のためのもの (権威は updateMany の count)。
      const pre = await ctx.prisma.adminInvitation.findUnique({
        where: { id: input.id },
        select: { id: true, status: true, email: true, supabaseUserId: true },
      });
      if (!pre) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (pre.status === "ACCEPTED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "受諾済みの招待は再送できません",
        });
      }

      // ② Supabase で invite link を再発行。
      //   既存 user (= 未受諾) でも `generateLink({ type: 'invite' })` は link を返す。
      const linkResult = await issueOwnerInviteLink(pre.email);
      if (!linkResult.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Supabase resend failed: ${linkResult.error.message}`,
        });
      }
      const { actionLink, supabaseUserId: newSupabaseUserId } = linkResult.value;

      // ③ Resend で送信。失敗したら DB は更新しない (現状の lastSentAt 維持)。
      const sendResult = await sendOwnerInviteEmail(pre.email, actionLink);
      if (!sendResult.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Resend send failed: ${sendResult.errorMessage}`,
        });
      }

      // ④ TOCTOU 対策: pre-check と DB 更新の間に accept が走り込んでも
      //   status を ACCEPTED → PENDING に上書きしないよう、condition 付き update を
      //   1 クエリで投げる。count === 0 は accept が先勝ちした証拠。
      const shouldUpdateSupabaseUserId =
        newSupabaseUserId !== null && newSupabaseUserId !== pre.supabaseUserId;
      const updated = await ctx.prisma.adminInvitation.updateMany({
        where: { id: input.id, status: { not: "ACCEPTED" } },
        data: {
          status: "PENDING",
          lastSentAt: new Date(),
          revokedAt: null,
          ...(shouldUpdateSupabaseUserId
            ? { supabaseUserId: newSupabaseUserId }
            : {}),
        },
      });
      if (updated.count === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "受諾済みの招待は再送できません (再送試行中に承諾されました)",
        });
      }

      return ctx.prisma.adminInvitation.findUniqueOrThrow({
        where: { id: input.id },
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
  claim: {
    kind: "claimed";
    invitation: { id: string; supabaseUserId: string | null };
  };
  email: string;
  errorMessage: string;
  phase: "generateLink" | "resend.send";
}

/**
 * create のフロー中で claim を上書きした後に Supabase or Resend が失敗した場合の
 * 共通ロールバック。常に TRPCError を throw する (戻り値は型上 never)。
 */
async function rollbackClaimToRevoked(args: RollbackArgs): Promise<never> {
  const { ctx, claim, email, errorMessage, phase } = args;
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
      supabaseError: errorMessage,
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
    message: `${prefix}: ${errorMessage}${rollbackSuffix}`,
  });
}
