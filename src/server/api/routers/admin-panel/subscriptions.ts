import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminPanelProcedure } from "@/server/api/admin-panel-procedure";
import { createTRPCRouter } from "@/server/api/trpc";
import { paginationInput } from "../admin/schemas";

const SUBSCRIPTION_PLAN_VALUES = [
  "FREE",
  "CASUAL",
  "PRO_TRIAL",
  "PRO_BUSINESS",
  "PRO_ENTERPRISE",
] as const;

const SUBSCRIPTION_STATUS_VALUES = [
  "ACTIVE",
  "PAST_DUE",
  "CANCELLED",
  "INCOMPLETE",
] as const;

const planEnum = z.enum(SUBSCRIPTION_PLAN_VALUES);
const statusEnum = z.enum(SUBSCRIPTION_STATUS_VALUES);

const listInput = paginationInput.extend({
  search: z.string().trim().min(1).max(120).optional(),
});

const changePlanInput = z.object({
  userId: z.string().min(1),
  plan: planEnum,
  status: statusEnum.optional(),
  // 個別調整したい時用のオプション (店舗追加など)。
  // 未指定なら SubscriptionPlanConfig 由来 (= プランの既定値) のまま。
  offerLimit: z.number().int().min(0).nullable().optional(),
  maxStores: z.number().int().min(1).nullable().optional(),
  // 契約ごとに毎月請求する金額。null の場合はプラン標準価格を使う。
  customMonthlyPriceJpy: z.number().int().min(0).nullable().optional(),
  note: z.string().max(500).optional(),
});

/**
 * 管理画面からオーナーのプランを手動で変更する router。
 *
 * 業態上、有料プランの契約は本人確認・契約形態の個別調整が必要で
 * 自動化できない (Stripe Checkout は constants.ts で禁止されている)。
 * 問い合わせ → 認証完了後に admin がここからプランを設定する想定。
 */
export const adminSubscriptionsPanelRouter = createTRPCRouter({
  list: adminPanelProcedure.input(listInput).query(async ({ ctx, input }) => {
    const users = await ctx.prisma.user.findMany({
      where: {
        role: "OWNER",
        deletedAt: null,
        ...(input.search && {
          OR: [{ email: { contains: input.search, mode: "insensitive" } }],
        }),
      },
      include: {
        owner: {
          include: {
            subscription: true,
          },
        },
      },
      take: input.limit + 1,
      cursor: input.cursor ? { id: input.cursor } : undefined,
      orderBy: { createdAt: "desc" },
    });

    let nextCursor: string | undefined;
    if (users.length > input.limit) {
      const nextItem = users.pop();
      nextCursor = nextItem?.id;
    }

    return { users, nextCursor };
  }),

  changePlan: adminPanelProcedure
    .input(changePlanInput)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({
        where: { id: input.userId, deletedAt: null },
        include: { owner: { select: { id: true } } },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ユーザーが見つかりません",
        });
      }

      if (user.role !== "OWNER") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "OWNER 以外のユーザーにはサブスクリプションを設定できません",
        });
      }

      if (!user.owner) {
        // OWNER role なのに Owner 行が無い場合 = データ不整合。
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "オーナー情報が見つかりません。データ整合性を確認してください",
        });
      }

      // プランマスタから既定の上限値を引く。見つからなければ null のまま。
      const planConfig = await ctx.prisma.subscriptionPlanConfig.findUnique({
        where: { plan: input.plan },
        select: { id: true, offerLimit: true, maxStores: true },
      });

      const status = input.status ?? "ACTIVE";
      const offerLimit =
        input.offerLimit !== undefined ? input.offerLimit : planConfig?.offerLimit ?? null;
      const maxStores =
        input.maxStores !== undefined ? input.maxStores : planConfig?.maxStores ?? null;
      const customMonthlyPriceJpy = input.customMonthlyPriceJpy ?? null;
      const planConfigId = planConfig?.id ?? null;

      // 監査ログ: admin の手動操作は console に構造化して残す。
      // Vercel Logs / Datadog から拾える前提。
      console.info("[adminPanel.subscriptions.changePlan]", {
        timestamp: new Date().toISOString(),
        userId: input.userId,
        ownerId: user.owner.id,
        plan: input.plan,
        status,
        offerLimit,
        maxStores,
        customMonthlyPriceJpy,
        planConfigId,
        note: input.note ?? null,
      });

      const subscription = await ctx.prisma.subscription.upsert({
        where: { ownerId: user.owner.id },
        update: {
          plan: input.plan,
          status,
          offerLimit,
          maxStores,
          customMonthlyPriceJpy,
          planConfigId,
        },
        create: {
          ownerId: user.owner.id,
          plan: input.plan,
          status,
          offerLimit,
          maxStores,
          customMonthlyPriceJpy,
          planConfigId,
        },
      });

      return subscription;
    }),
});
