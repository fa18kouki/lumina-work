import { z } from "zod";
import { createTRPCRouter, ownerProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { getStripe } from "@/lib/stripe";
import { getOfferLimitForPlan } from "@/lib/constants";
import type { SubscriptionPlanId } from "@/lib/constants";

/** プランIDからStripe Price IDを取得 */
function getStripePriceId(plan: SubscriptionPlanId): string {
  const map: Record<SubscriptionPlanId, string | undefined> = {
    CASUAL: process.env.STRIPE_CASUAL_PRICE_ID,
    PRO_TRIAL: process.env.STRIPE_PRO_TRIAL_PRICE_ID,
    PRO_BUSINESS: process.env.STRIPE_PRO_BUSINESS_PRICE_ID,
    PRO_ENTERPRISE: process.env.STRIPE_PRO_ENTERPRISE_PRICE_ID,
  };
  const priceId = map[plan];
  if (!priceId) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "プランの価格IDが設定されていません",
    });
  }
  return priceId;
}

/** 3ヶ月後のトライアル終了日を計算 */
function calcTrialEnd(baseDate: Date): Date {
  const trialEnd = new Date(baseDate);
  trialEnd.setMonth(trialEnd.getMonth() + 3);
  return trialEnd;
}

export const subscriptionRouter = createTRPCRouter({
  /**
   * 現在のサブスクリプション取得
   */
  getSubscription: ownerProcedure.query(async ({ ctx }) => {
    const owner = await ctx.prisma.owner.findUnique({
      where: { userId: ctx.session.user.id },
      include: { subscription: true },
    });

    if (!owner) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "オーナー情報が見つかりません",
      });
    }

    return owner.subscription ?? { plan: "CASUAL" as const, status: "ACTIVE" as const, offerLimit: 10, maxStores: null, trialEndsAt: null };
  }),

  /**
   * Stripe Checkout セッション作成
   */
  createCheckoutSession: ownerProcedure
    .input(
      z.object({
        plan: z.enum(["CASUAL", "PRO_TRIAL", "PRO_BUSINESS", "PRO_ENTERPRISE"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const owner = await ctx.prisma.owner.findUnique({
        where: { userId: ctx.session.user.id },
        include: {
          subscription: true,
          _count: { select: { stores: true } },
        },
      });

      if (!owner) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "オーナー情報が見つかりません",
        });
      }

      const priceId = getStripePriceId(input.plan);
      const offerLimit = getOfferLimitForPlan(input.plan);

      // トライアル期間: アカウント作成から3ヶ月
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { createdAt: true },
      });
      const trialEnd = user ? calcTrialEnd(user.createdAt) : undefined;
      const now = new Date();
      const isEligibleForTrial = trialEnd && trialEnd > now;

      // 店舗数に基づいた数量
      const quantity = Math.max(owner._count.stores, 1);

      const session = await getStripe().checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity }],
        success_url: `${process.env.AUTH_URL}/o/subscription?success=true`,
        cancel_url: `${process.env.AUTH_URL}/o/subscription?cancelled=true`,
        metadata: {
          ownerId: owner.id,
          plan: input.plan,
          offerLimit: offerLimit !== null ? String(offerLimit) : "",
          trialEndsAt: isEligibleForTrial ? trialEnd.toISOString() : "",
        },
        ...(isEligibleForTrial && {
          subscription_data: {
            trial_end: Math.floor(trialEnd.getTime() / 1000),
          },
        }),
        ...(owner.subscription?.stripeCustomerId && {
          customer: owner.subscription.stripeCustomerId,
        }),
      });

      return { url: session.url };
    }),

  /**
   * Stripe Customer Portal セッション作成
   */
  createPortalSession: ownerProcedure.mutation(async ({ ctx }) => {
    const owner = await ctx.prisma.owner.findUnique({
      where: { userId: ctx.session.user.id },
      include: { subscription: true },
    });

    if (!owner?.subscription?.stripeCustomerId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "サブスクリプションが見つかりません",
      });
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: owner.subscription.stripeCustomerId,
      return_url: `${process.env.AUTH_URL}/o/subscription`,
    });

    return { url: session.url };
  }),
});
