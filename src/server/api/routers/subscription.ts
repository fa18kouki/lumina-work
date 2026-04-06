import { z } from "zod";
import { createTRPCRouter, ownerProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { getStripe } from "@/lib/stripe";
import { getOfferLimitForPlan } from "@/lib/constants";
import type { SubscriptionPlanId } from "@/lib/constants";

/** プランIDからStripe Price IDを取得 */
function getStripePriceId(plan: Exclude<SubscriptionPlanId, "FREE">): string {
  const map: Record<Exclude<SubscriptionPlanId, "FREE">, string | undefined> = {
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

    return owner.subscription ?? { plan: "FREE" as const, status: "ACTIVE" as const, offerLimit: 3, maxStores: 1, trialEndsAt: null };
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

      // リファーラル割引の確認
      const ownerRecord = await ctx.prisma.owner.findUnique({
        where: { userId: ctx.session.user.id },
        select: { id: true },
      });
      const pendingReferral = ownerRecord
        ? await ctx.prisma.referral.findFirst({
            where: { referredOwnerId: ownerRecord.id, status: "PENDING" },
          })
        : null;

      // 紹介者の未適用クーポンも確認
      const unappliedReferrerCoupon = ownerRecord
        ? await ctx.prisma.referral.findFirst({
            where: {
              referrerOwnerId: ownerRecord.id,
              status: "COMPLETED",
              referrerCouponId: { not: null },
            },
            // referrerCouponApplied がないので、Stripe側で適用済みかはStripeに任せる
          })
        : null;

      let discounts: { coupon: string }[] | undefined;

      if (pendingReferral) {
        // 紹介された側: 初月100%OFFクーポンを作成
        const coupon = await getStripe().coupons.create({
          percent_off: 100,
          duration: "once",
          name: "紹介特典 - 初月無料",
        });
        await ctx.prisma.referral.update({
          where: { id: pendingReferral.id },
          data: { referredCouponId: coupon.id },
        });
        discounts = [{ coupon: coupon.id }];
      } else if (unappliedReferrerCoupon?.referrerCouponId) {
        // 紹介者側の未適用クーポンがある場合
        discounts = [{ coupon: unappliedReferrerCoupon.referrerCouponId }];
      }

      // リファーラル割引がある場合はトライアルをスキップ（Stripe制約: discounts と trial_end は併用不可）
      const useDiscount = !!discounts;
      const applyTrial = isEligibleForTrial && !useDiscount;

      const session = await getStripe().checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity }],
        success_url: `${process.env.AUTH_URL}/o/subscription?success=true`,
        cancel_url: `${process.env.AUTH_URL}/o/subscription?cancelled=true`,
        metadata: {
          ownerId: owner.id,
          plan: input.plan,
          offerLimit: offerLimit !== null ? String(offerLimit) : "",
          trialEndsAt: applyTrial ? trialEnd.toISOString() : "",
          ...(pendingReferral && { referralId: pendingReferral.id }),
        },
        ...(discounts && { discounts }),
        ...(applyTrial && {
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
   * 請求書一覧取得
   */
  listInvoices: ownerProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const owner = await ctx.prisma.owner.findUnique({
        where: { userId: ctx.session.user.id },
        select: { subscription: { select: { id: true } } },
      });

      if (!owner?.subscription) {
        return { invoices: [], nextCursor: undefined };
      }

      const invoices = await ctx.prisma.invoice.findMany({
        where: { subscriptionId: owner.subscription.id },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined;
      if (invoices.length > input.limit) {
        const nextItem = invoices.pop();
        nextCursor = nextItem?.id;
      }

      return { invoices, nextCursor };
    }),

  /**
   * Stripeから請求書データを同期
   */
  syncInvoices: ownerProcedure.mutation(async ({ ctx }) => {
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

    const stripe = getStripe();
    const stripeInvoices = await stripe.invoices.list({
      customer: owner.subscription.stripeCustomerId,
      limit: 100,
    });

    let synced = 0;
    for (const inv of stripeInvoices.data) {
      if (!inv.status || inv.status === "draft") continue;
      await ctx.prisma.invoice.upsert({
        where: { stripeInvoiceId: inv.id },
        create: {
          subscriptionId: owner.subscription.id,
          stripeInvoiceId: inv.id,
          number: inv.number,
          amountDue: inv.amount_due,
          amountPaid: inv.amount_paid,
          currency: inv.currency ?? "jpy",
          status: inv.status,
          invoicePdfUrl: inv.invoice_pdf,
          hostedInvoiceUrl: inv.hosted_invoice_url,
          periodStart: new Date(inv.period_start * 1000),
          periodEnd: new Date(inv.period_end * 1000),
          paidAt: inv.status === "paid" ? new Date(inv.status_transitions?.paid_at ? inv.status_transitions.paid_at * 1000 : Date.now()) : null,
        },
        update: {
          amountPaid: inv.amount_paid,
          status: inv.status,
          invoicePdfUrl: inv.invoice_pdf,
          hostedInvoiceUrl: inv.hosted_invoice_url,
          paidAt: inv.status === "paid" ? new Date(inv.status_transitions?.paid_at ? inv.status_transitions.paid_at * 1000 : Date.now()) : null,
        },
      });
      synced++;
    }

    return { synced };
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
