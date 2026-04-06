import { z } from "zod";
import { createTRPCRouter, ownerWithRecordProcedure, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { generateReferralCode, REFERRAL_CONFIG } from "@/lib/constants";

export const referralRouter = createTRPCRouter({
  /**
   * 自分の紹介コードを取得（未生成なら生成して返す）
   */
  getMyReferralCode: ownerWithRecordProcedure.query(async ({ ctx }) => {
    if (ctx.owner.referralCode) {
      return { code: ctx.owner.referralCode };
    }

    // コード生成（ユニーク制約違反時はリトライ）
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateReferralCode();
      try {
        await ctx.prisma.owner.update({
          where: { id: ctx.owner.id },
          data: { referralCode: code },
        });
        return { code };
      } catch {
        if (attempt === 4) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "紹介コードの生成に失敗しました" });
        }
      }
    }

    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "紹介コードの生成に失敗しました" });
  }),

  /**
   * 自分の紹介履歴を取得
   */
  getMyReferrals: ownerWithRecordProcedure.query(async ({ ctx }) => {
    const referrals = await ctx.prisma.referral.findMany({
      where: { referrerOwnerId: ctx.owner.id },
      include: {
        referredOwner: {
          include: {
            user: { select: { email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return referrals.map((r) => ({
      id: r.id,
      status: r.status,
      // メールアドレスをマスク（例: t***@example.com）
      referredEmail: r.referredOwner?.user.email
        ? maskEmail(r.referredOwner.user.email)
        : null,
      completedAt: r.completedAt,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
    }));
  }),

  /**
   * 紹介コードの有効性チェック（登録画面で使用）
   */
  validateReferralCode: publicProcedure
    .input(z.object({ code: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const owner = await ctx.prisma.owner.findUnique({
        where: { referralCode: input.code.toUpperCase() },
        select: { companyName: true },
      });

      return {
        valid: !!owner,
        referrerName: owner?.companyName ?? undefined,
      };
    }),
});

/** メールアドレスをマスクする */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  return `${local[0]}***@${domain}`;
}
