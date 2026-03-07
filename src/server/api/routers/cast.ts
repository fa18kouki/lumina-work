import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  castProcedure,
} from "@/server/api/trpc";
import { dispatchNotification } from "@/server/notifications";

export const castRouter = createTRPCRouter({
  /**
   * キャストプロフィール取得
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const cast = await ctx.prisma.cast.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        experiences: true,
      },
    });

    return cast;
  }),

  /**
   * キャストプロフィール作成・更新
   */
  upsertProfile: protectedProcedure
    .input(
      z.object({
        // 基本情報
        nickname: z.string().min(1).max(50),
        age: z.number().min(18).max(99),
        birthDate: z.string().optional(), // ISO8601形式
        description: z.string().max(1000).optional(),
        photos: z.array(z.string().url()).max(10).optional(),

        // 連絡先
        instagramId: z.string().max(30).optional(),
        lineId: z.string().max(50).optional(),
        currentListingUrl: z.string().url().optional().or(z.literal("")),

        // 経験・スキル
        experiences: z
          .array(
            z.object({
              area: z.string(),
              businessType: z.enum([
                "CABARET",
                "CLUB",
                "LOUNGE",
                "GIRLS_BAR",
                "SNACK",
                "OTHER",
              ]),
              durationMonths: z.number().min(0).optional(),
            })
          )
          .optional(),
        totalExperienceYears: z.number().min(0).max(50).optional(),
        previousHourlyRate: z.number().min(0).optional(),
        monthlySales: z.number().min(0).optional(),
        monthlyNominations: z.number().min(0).optional(),
        alcoholTolerance: z
          .enum(["NONE", "WEAK", "MODERATE", "STRONG"])
          .optional(),

        // 希望条件
        desiredAreas: z.array(z.string()).optional(),
        desiredSalary: z.number().positive().optional(), // 後方互換
        desiredHourlyRate: z.number().min(0).optional(),
        desiredMonthlyIncome: z.number().min(0).optional(),
        availableDaysPerWeek: z.number().min(1).max(7).optional(),
        preferredAtmosphere: z.array(z.string()).optional(),
        preferredClientele: z.array(z.string()).optional(),

        // リスク回避
        downtimeUntil: z.string().optional(), // ISO8601形式
        isAvailableNow: z.boolean().optional(),

        // 自己PR
        birthdaySales: z.number().min(0).optional(),
        hasVipClients: z.boolean().optional(),
        vipClientDescription: z.string().max(500).optional(),
        socialFollowers: z.number().min(0).optional(),

        // MUST/WANT条件
        mustConditions: z.record(z.string(), z.unknown()).optional(),
        wantConditions: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const mustConditions = input.mustConditions as
        | Prisma.InputJsonValue
        | undefined;
      const wantConditions = input.wantConditions as
        | Prisma.InputJsonValue
        | undefined;

      // 日付のパース
      const birthDate = input.birthDate
        ? new Date(input.birthDate)
        : undefined;
      const downtimeUntil = input.downtimeUntil
        ? new Date(input.downtimeUntil)
        : undefined;

      const profileData = {
        nickname: input.nickname,
        age: input.age,
        birthDate,
        description: input.description,
        photos: input.photos ?? [],
        // 連絡先
        instagramId: input.instagramId,
        lineId: input.lineId,
        currentListingUrl: input.currentListingUrl || null,
        // 経験・スキル
        totalExperienceYears: input.totalExperienceYears,
        previousHourlyRate: input.previousHourlyRate,
        monthlySales: input.monthlySales,
        monthlyNominations: input.monthlyNominations,
        alcoholTolerance: input.alcoholTolerance,
        // 希望条件
        desiredAreas: input.desiredAreas ?? [],
        desiredSalary: input.desiredSalary,
        desiredHourlyRate: input.desiredHourlyRate,
        desiredMonthlyIncome: input.desiredMonthlyIncome,
        availableDaysPerWeek: input.availableDaysPerWeek,
        preferredAtmosphere: input.preferredAtmosphere ?? [],
        preferredClientele: input.preferredClientele ?? [],
        // リスク回避
        downtimeUntil,
        isAvailableNow: input.isAvailableNow ?? true,
        // 自己PR
        birthdaySales: input.birthdaySales,
        hasVipClients: input.hasVipClients ?? false,
        vipClientDescription: input.vipClientDescription,
        socialFollowers: input.socialFollowers,
        // MUST/WANT
        mustConditions,
        wantConditions,
      };

      const cast = await ctx.prisma.cast.upsert({
        where: { userId: ctx.session.user.id },
        update: profileData,
        create: {
          userId: ctx.session.user.id,
          ...profileData,
        },
      });

      // 経験データの更新（存在する場合は全削除して再作成）
      if (input.experiences && input.experiences.length > 0) {
        await ctx.prisma.castExperience.deleteMany({
          where: { castId: cast.id },
        });

        await ctx.prisma.castExperience.createMany({
          data: input.experiences.map((exp) => ({
            castId: cast.id,
            area: exp.area,
            businessType: exp.businessType,
            durationMonths: exp.durationMonths,
          })),
        });
      }

      // ユーザーロールをCASTに設定
      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { role: "CAST" },
      });

      return cast;
    }),

  /**
   * 店舗検索
   */
  searchStores: castProcedure
    .input(
      z.object({
        area: z.string().optional(),
        minSalary: z.number().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const stores = await ctx.prisma.store.findMany({
        where: {
          isVerified: true,
          ...(input.area && { area: { contains: input.area } }),
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined;
      if (stores.length > input.limit) {
        const nextItem = stores.pop();
        nextCursor = nextItem?.id;
      }

      return {
        stores,
        nextCursor,
      };
    }),

  /**
   * 受信オファー一覧
   */
  getOffers: castProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "ACCEPTED", "REJECTED", "EXPIRED"]).optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const cast = await ctx.prisma.cast.findUnique({
        where: { userId: ctx.session.user.id },
        select: { id: true },
      });

      if (!cast) {
        return { offers: [], nextCursor: undefined };
      }

      const offers = await ctx.prisma.offer.findMany({
        where: {
          castId: cast.id,
          ...(input.status && { status: input.status }),
        },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              area: true,
              photos: true,
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
   * オファー詳細取得
   */
  getOfferDetail: castProcedure
    .input(
      z.object({
        offerId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const cast = await ctx.prisma.cast.findUnique({
        where: { userId: ctx.session.user.id },
        select: { id: true },
      });

      if (!cast) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "キャストプロフィールが見つかりません",
        });
      }

      const offer = await ctx.prisma.offer.findUnique({
        where: {
          id: input.offerId,
          castId: cast.id,
        },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              area: true,
              address: true,
              description: true,
              photos: true,
              businessHours: true,
              salarySystem: true,
              benefits: true,
              isVerified: true,
            },
          },
        },
      });

      if (!offer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "オファーが見つかりません",
        });
      }

      return offer;
    }),

  /**
   * オファーに回答
   */
  respondToOffer: castProcedure
    .input(
      z.object({
        offerId: z.string(),
        accept: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const cast = await ctx.prisma.cast.findUnique({
        where: { userId: ctx.session.user.id },
        select: { id: true, nickname: true },
      });

      if (!cast) {
        throw new Error("キャストプロフィールが見つかりません");
      }

      const offer = await ctx.prisma.offer.update({
        where: {
          id: input.offerId,
          castId: cast.id,
        },
        data: {
          status: input.accept ? "ACCEPTED" : "REJECTED",
        },
        include: {
          store: {
            select: {
              userId: true,
              user: { select: { email: true } },
            },
          },
        },
      });

      // オファー承諾時にやりとりを作成
      if (input.accept) {
        await ctx.prisma.match.create({
          data: {
            castId: cast.id,
            storeId: offer.storeId,
            status: "ACCEPTED",
          },
        });
      }

      // 店舗に通知送信
      const storeUserId = offer.store.userId;
      const storeEmail = offer.store.user.email;
      const castNickname = cast.nickname ?? "キャスト";

      if (input.accept) {
        await dispatchNotification({
          type: "OFFER_ACCEPTED",
          payload: {
            recipientUserId: storeUserId,
            offerId: offer.id,
            storeEmail,
            castNickname,
          },
        });
      } else {
        await dispatchNotification({
          type: "OFFER_REJECTED",
          payload: {
            recipientUserId: storeUserId,
            offerId: offer.id,
            storeEmail,
            castNickname,
          },
        });
      }

      return offer;
    }),

  /**
   * 店舗詳細取得
   */
  getStoreDetail: castProcedure
    .input(z.object({ storeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const store = await ctx.prisma.store.findUnique({
        where: { id: input.storeId, isVerified: true },
      });

      if (!store) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "店舗が見つかりません",
        });
      }

      return store;
    }),
});
