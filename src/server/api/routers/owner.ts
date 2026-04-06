import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  ownerProcedure,
} from "@/server/api/trpc";

export const ownerRouter = createTRPCRouter({
  /**
   * オーナープロフィール取得
   */
  getProfile: ownerProcedure.query(async ({ ctx }) => {
    const owner = await ctx.prisma.owner.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        stores: {
          select: { id: true, name: true, area: true, isVerified: true },
          orderBy: { createdAt: "asc" },
        },
        subscription: true,
      },
    });

    return owner;
  }),

  /**
   * ダッシュボード用統合データ取得（1クエリ）
   */
  getDashboard: ownerProcedure.query(async ({ ctx }) => {
    const owner = await ctx.prisma.owner.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        stores: {
          select: {
            id: true,
            name: true,
            area: true,
            address: true,
            photos: true,
            isVerified: true,
            createdAt: true,
            _count: {
              select: {
                offers: true,
                interviews: true,
              },
            },
          },
          orderBy: { createdAt: "asc" as const },
        },
        subscription: true,
      },
    });

    return owner;
  }),

  /**
   * オーナープロフィール更新
   */
  upsertProfile: ownerProcedure
    .input(
      z.object({
        companyName: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const owner = await ctx.prisma.owner.upsert({
        where: { userId: ctx.session.user.id },
        update: {
          companyName: input.companyName,
        },
        create: {
          userId: ctx.session.user.id,
          companyName: input.companyName,
        },
      });

      return owner;
    }),

  /**
   * 所有店舗一覧
   */
  listStores: ownerProcedure.query(async ({ ctx }) => {
    const owner = await ctx.prisma.owner.findUnique({
      where: { userId: ctx.session.user.id },
      select: { id: true },
    });

    if (!owner) {
      return [];
    }

    const stores = await ctx.prisma.store.findMany({
      where: { ownerId: owner.id },
      select: {
        id: true,
        name: true,
        area: true,
        address: true,
        photos: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            offers: true,
            interviews: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return stores;
  }),

  /**
   * 新規店舗追加
   */
  createStore: ownerProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        area: z.string().min(1).max(50),
        address: z.string().min(1).max(200),
        referralSource: z.string().max(100).optional(),
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

      // プランに応じた店舗数上限チェック
      const maxStores = owner.subscription?.maxStores ?? 1;
      if (owner._count.stores >= maxStores) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `現在のプランでは${maxStores}店舗まで登録可能です。プランをアップグレードしてください。`,
        });
      }

      const store = await ctx.prisma.store.create({
        data: {
          ownerId: owner.id,
          name: input.name,
          area: input.area,
          address: input.address,
          isVerified: true,
          referralSource: input.referralSource,
        },
      });

      return store;
    }),

  /**
   * 店舗数取得
   */
  getStoreCount: ownerProcedure.query(async ({ ctx }) => {
    const owner = await ctx.prisma.owner.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        subscription: { select: { maxStores: true } },
        _count: { select: { stores: true } },
      },
    });

    if (!owner) {
      return { current: 0, max: null };
    }

    return {
      current: owner._count.stores,
      max: owner.subscription?.maxStores ?? 1,
    };
  }),

  /**
   * 店舗別オファー統計取得
   */
  getOfferStats: ownerProcedure.query(async ({ ctx }) => {
    const owner = await ctx.prisma.owner.findUnique({
      where: { userId: ctx.session.user.id },
      select: { id: true },
    });

    if (!owner) return [];

    const stores = await ctx.prisma.store.findMany({
      where: { ownerId: owner.id },
      select: {
        id: true,
        name: true,
        area: true,
        _count: {
          select: {
            offers: true,
            interviews: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // 各店舗のオファーステータス別カウントを取得
    const storeStats = await Promise.all(
      stores.map(async (store) => {
        const [pending, accepted, rejected, expired] = await Promise.all([
          ctx.prisma.offer.count({ where: { storeId: store.id, status: "PENDING" } }),
          ctx.prisma.offer.count({ where: { storeId: store.id, status: "ACCEPTED" } }),
          ctx.prisma.offer.count({ where: { storeId: store.id, status: "REJECTED" } }),
          ctx.prisma.offer.count({ where: { storeId: store.id, status: "EXPIRED" } }),
        ]);

        return {
          storeId: store.id,
          storeName: store.name,
          storeArea: store.area,
          total: store._count.offers,
          pending,
          accepted,
          rejected,
          expired,
          interviews: store._count.interviews,
          acceptRate: store._count.offers > 0
            ? Math.round((accepted / store._count.offers) * 100)
            : 0,
        };
      })
    );

    return storeStats;
  }),
});
