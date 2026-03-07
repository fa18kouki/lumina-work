import { z } from "zod";
import type { Prisma } from "@prisma/client";
import {
  createTRPCRouter,
  protectedProcedure,
  storeProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { dispatchNotification } from "@/server/notifications";

export const storeRouter = createTRPCRouter({
  /**
   * 店舗プロフィール取得
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const store = await ctx.prisma.store.findUnique({
      where: { userId: ctx.session.user.id },
    });

    return store;
  }),

  /**
   * 店舗プロフィール作成・更新
   */
  upsertProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        area: z.string().min(1).max(50),
        address: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        photos: z.array(z.string().url()).max(20).optional(),
        businessHours: z.string().max(200).optional(),
        salarySystem: z.object({
          hourlyRateMin: z.number().min(1000).max(100000),
          hourlyRateMax: z.number().min(1000).max(100000),
          companionBackMin: z.number().min(0).optional(),
          companionBackMax: z.number().min(0).optional(),
          drinkBackMin: z.number().min(0).optional(),
          drinkBackMax: z.number().min(0).optional(),
          nominationBackMin: z.number().min(0).optional(),
          nominationBackMax: z.number().min(0).optional(),
          floorNominationBackMin: z.number().min(0).optional(),
          floorNominationBackMax: z.number().min(0).optional(),
          salesBackMinPercent: z.number().min(0).max(100).optional(),
          salesBackMaxPercent: z.number().min(0).max(100).optional(),
        }).optional(),
        benefits: z.array(z.string()).optional(),
        mustConditions: z.record(z.string(), z.unknown()).optional(),
        wantConditions: z.record(z.string(), z.unknown()).optional(),
        referralSource: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const mustConditions = input.mustConditions as Prisma.InputJsonValue | undefined;
      const wantConditions = input.wantConditions as Prisma.InputJsonValue | undefined;
      const salarySystem = input.salarySystem as Prisma.InputJsonValue | undefined;

      const store = await ctx.prisma.store.upsert({
        where: { userId: ctx.session.user.id },
        update: {
          name: input.name,
          area: input.area,
          address: input.address,
          description: input.description,
          photos: input.photos ?? [],
          businessHours: input.businessHours,
          salarySystem,
          benefits: input.benefits ?? [],
          mustConditions,
          wantConditions,
          referralSource: input.referralSource,
        },
        create: {
          userId: ctx.session.user.id,
          name: input.name,
          area: input.area,
          address: input.address,
          description: input.description,
          photos: input.photos ?? [],
          businessHours: input.businessHours,
          salarySystem,
          benefits: input.benefits ?? [],
          mustConditions,
          wantConditions,
          referralSource: input.referralSource,
        },
      });

      // ユーザーロールをSTOREに設定
      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { role: "STORE" },
      });

      return store;
    }),

  /**
   * 店舗設定取得
   */
  getSettings: storeProcedure.query(async ({ ctx }) => {
    const store = await ctx.prisma.store.findUnique({
      where: { userId: ctx.session.user.id },
      select: { notificationSettings: true },
    });

    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { email: true, phone: true },
    });

    const defaultNotifications = {
      newApplicant: true,
      offerResponse: true,
      interviewReminder: true,
      messageReceived: true,
      systemAnnouncement: true,
    };

    const notifications = (store?.notificationSettings as Record<string, boolean> | null) ?? defaultNotifications;

    return {
      notifications: { ...defaultNotifications, ...notifications },
      account: {
        email: user?.email ?? "",
        phone: user?.phone ?? "",
      },
    };
  }),

  /**
   * 通知設定更新
   */
  updateNotificationSettings: storeProcedure
    .input(
      z.object({
        newApplicant: z.boolean(),
        offerResponse: z.boolean(),
        interviewReminder: z.boolean(),
        messageReceived: z.boolean(),
        systemAnnouncement: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const store = await ctx.prisma.store.update({
        where: { userId: ctx.session.user.id },
        data: { notificationSettings: input },
        select: { notificationSettings: true },
      });

      return store.notificationSettings as Record<string, boolean>;
    }),

  /**
   * キャスト検索
   */
  searchCasts: storeProcedure
    .input(
      z.object({
        area: z.string().optional(),
        minAge: z.number().min(18).optional(),
        maxAge: z.number().max(99).optional(),
        rank: z.enum(["C", "B", "A", "S"]).optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const casts = await ctx.prisma.cast.findMany({
        where: {
          idVerified: true,
          isSuspended: false,
          ...(input.area && {
            desiredAreas: { has: input.area },
          }),
          ...(input.minAge && { age: { gte: input.minAge } }),
          ...(input.maxAge && { age: { lte: input.maxAge } }),
          ...(input.rank && { rank: input.rank }),
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined;
      if (casts.length > input.limit) {
        const nextItem = casts.pop();
        nextCursor = nextItem?.id;
      }

      return {
        casts,
        nextCursor,
      };
    }),

  /**
   * オファー送信
   */
  sendOffer: storeProcedure
    .input(
      z.object({
        castId: z.string(),
        message: z.string().min(1).max(1000),
        expiresInDays: z.number().min(1).max(30).default(7),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const store = await ctx.prisma.store.findUnique({
        where: { userId: ctx.session.user.id },
        select: { id: true, name: true, area: true },
      });

      if (!store) {
        throw new Error("店舗プロフィールが見つかりません");
      }

      // 既存のオファーがないか確認
      const existingOffer = await ctx.prisma.offer.findFirst({
        where: {
          storeId: store.id,
          castId: input.castId,
          status: "PENDING",
        },
      });

      if (existingOffer) {
        throw new Error("このキャストには既にオファーを送信済みです");
      }

      // キャスト情報を取得（通知に必要）
      const cast = await ctx.prisma.cast.findUnique({
        where: { id: input.castId },
        select: {
          id: true,
          userId: true,
          lineUserId: true,
          user: { select: { email: true } },
        },
      });

      if (!cast) {
        throw new Error("キャストが見つかりません");
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

      const offer = await ctx.prisma.offer.create({
        data: {
          storeId: store.id,
          castId: input.castId,
          message: input.message,
          expiresAt,
        },
      });

      // 通知送信（fire-and-forget: 失敗してもオファー作成に影響しない）
      await dispatchNotification({
        type: "OFFER_RECEIVED",
        payload: {
          offerId: offer.id,
          castUserId: cast.userId,
          castLineUserId: cast.lineUserId,
          castEmail: cast.user.email,
          storeName: store.name,
          storeArea: store.area,
          offerMessage: input.message,
        },
      });

      return offer;
    }),

  /**
   * 送信オファー一覧
   */
  getSentOffers: storeProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "ACCEPTED", "REJECTED", "EXPIRED"]).optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const store = await ctx.prisma.store.findUnique({
        where: { userId: ctx.session.user.id },
        select: { id: true },
      });

      if (!store) {
        return { offers: [], nextCursor: undefined };
      }

      const offers = await ctx.prisma.offer.findMany({
        where: {
          storeId: store.id,
          ...(input.status && { status: input.status }),
        },
        include: {
          cast: {
            select: {
              id: true,
              nickname: true,
              age: true,
              photos: true,
              rank: true,
            },
          },
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined;
      if (offers.length > input.limit) {
        const nextItem = offers.pop();
        nextCursor = nextItem?.id;
      }

      return {
        offers,
        nextCursor,
      };
    }),

  /**
   * 公開店舗一覧取得（認証不要）
   */
  getPublicList: publicProcedure.query(async ({ ctx }) => {
    const stores = await ctx.prisma.store.findMany({
      where: { isVerified: true },
      select: {
        id: true,
        name: true,
        area: true,
        description: true,
        photos: true,
        salarySystem: true,
        benefits: true,
        businessHours: true,
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    return stores;
  }),
});
