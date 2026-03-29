import { z } from "zod";
import { createTRPCRouter, storeProcedure } from "@/server/api/trpc";
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
  getSubscription: storeProcedure.query(async ({ ctx }) => {
    const store = await ctx.prisma.store.findFirst({
      where: { userId: ctx.session.user.id },
      include: { subscription: true },
    });

    if (!store) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "店舗が見つかりません",
      });
    }

    return store.subscription ?? { plan: "CASUAL" as const, status: "ACTIVE" as const, offerLimit: 10, trialEndsAt: null };
  }),

  /**
   * Stripe Checkout セッション作成
   */
  createCheckoutSession: storeProcedure
    .input(
      z.object({
        plan: z.enum(["CASUAL", "PRO_TRIAL", "PRO_BUSINESS", "PRO_ENTERPRISE"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const store = await ctx.prisma.store.findFirst({
        where: { userId: ctx.session.user.id },
        include: { subscription: true },
      });

      if (!store) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "店舗が見つかりません",
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

      const session = await getStripe().checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.AUTH_URL}/s/subscription?success=true`,
        cancel_url: `${process.env.AUTH_URL}/s/subscription?cancelled=true`,
        metadata: {
          storeId: store.id,
          plan: input.plan,
          offerLimit: offerLimit !== null ? String(offerLimit) : "",
          trialEndsAt: isEligibleForTrial ? trialEnd.toISOString() : "",
        },
        ...(isEligibleForTrial && {
          subscription_data: {
            trial_end: Math.floor(trialEnd.getTime() / 1000),
          },
        }),
        ...(store.subscription?.stripeCustomerId && {
          customer: store.subscription.stripeCustomerId,
        }),
      });

      return { url: session.url };
    }),

  /**
   * Stripe Customer Portal セッション作成
   */
  createPortalSession: storeProcedure.mutation(async ({ ctx }) => {
    const store = await ctx.prisma.store.findFirst({
      where: { userId: ctx.session.user.id },
      include: { subscription: true },
    });

    if (!store?.subscription?.stripeCustomerId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "サブスクリプションが見つかりません",
      });
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: store.subscription.stripeCustomerId,
      return_url: `${process.env.AUTH_URL}/s/subscription`,
    });

    return { url: session.url };
  }),
});
