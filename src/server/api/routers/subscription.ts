import { z } from "zod";
import { createTRPCRouter, storeProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { getStripe } from "@/lib/stripe";

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

    return store.subscription ?? { plan: "FREE", status: "ACTIVE" };
  }),

  /**
   * Stripe Checkout セッション作成
   */
  createCheckoutSession: storeProcedure
    .input(
      z.object({
        plan: z.enum(["BASIC", "PREMIUM"]),
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

      const priceId =
        input.plan === "BASIC"
          ? process.env.STRIPE_BASIC_PRICE_ID
          : process.env.STRIPE_PREMIUM_PRICE_ID;

      if (!priceId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "プランの価格IDが設定されていません",
        });
      }

      const session = await getStripe().checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.AUTH_URL}/s/subscription?success=true`,
        cancel_url: `${process.env.AUTH_URL}/s/subscription?cancelled=true`,
        metadata: {
          storeId: store.id,
          plan: input.plan,
        },
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
