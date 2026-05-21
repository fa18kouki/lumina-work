import { TRPCError } from "@trpc/server";
import { z } from "zod";

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

async function sendSupabaseInvite(email: string) {
  const supabase = getSupabaseAdminClient();
  const redirectTo = getInviteRedirectTo();
  return supabase.auth.admin.inviteUserByEmail(
    email,
    redirectTo ? { redirectTo } : undefined,
  );
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

      // ② Supabase 招待 (外部 API なので transaction 外で呼ぶ)。
      const { data, error } = await sendSupabaseInvite(input.email);
      if (error) {
        // ロールバック: 失敗した招待は REVOKED にして「実体無し」状態に戻す。
        // ロールバック自体が失敗すると "Supabase は失敗したが Prisma 上は PENDING"
        // という不整合が残り、再招待が CONFLICT で詰まるので、両方の error を
        // 構造化ログに残した上で TRPCError のメッセージにも両方の文脈を含める。
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
            email: input.email,
            supabaseError: error.message,
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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Supabase invite failed: ${error.message}${rollbackSuffix}`,
        });
      }

      // ③ supabaseUserId を紐付け。
      const supabaseUserId = data.user?.id ?? null;
      if (supabaseUserId && supabaseUserId !== claim.invitation.supabaseUserId) {
        await ctx.prisma.adminInvitation.update({
          where: { id: claim.invitation.id },
          data: { supabaseUserId },
        });
      }
      // 戻り値は claim 時点の行 + 紐付け済の supabaseUserId を merge して返す
      // (update の戻り値に依存せず、テストとプロダクションで挙動を統一)
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

      const { error } = await sendSupabaseInvite(invitation.email);
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Supabase resend failed: ${error.message}`,
        });
      }

      return ctx.prisma.adminInvitation.update({
        where: { id: input.id },
        data: {
          status: "PENDING",
          lastSentAt: new Date(),
          revokedAt: null,
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
