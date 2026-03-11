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
        workHistories: true,
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
          .enum(["NONE", "WEAK", "MODERATE", "STRONG", "NG"])
          .optional(),

        // カテゴリ1: 基本情報・連絡先（追加分）
        fullName: z.string().max(100).optional(),
        furigana: z.string().max(100).optional(),
        gender: z.string().optional(),
        currentArea: z.string().optional(),
        permanentAddress: z.string().max(200).optional(),
        phoneNumber: z.string().max(20).optional(),
        bloodType: z.string().optional(),
        zodiacSign: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        pcEmail: z.string().email().optional().or(z.literal("")),
        facebookId: z.string().max(50).optional(),
        twitterId: z.string().max(50).optional(),
        tiktokId: z.string().max(50).optional(),
        hobbies: z.string().max(500).optional(),
        specialSkills: z.string().max(500).optional(),
        medicalConditions: z.string().max(500).optional(),
        debt: z.string().max(500).optional(),
        qualifications: z.string().max(500).optional(),
        interviewDate: z.string().optional(),
        trialDate: z.string().optional(),
        employmentStatus: z.enum(["INTERVIEW_ONLY", "TRIAL", "EMPLOYED", "RESIGNED"]).optional(),
        emergencyContact: z.record(z.string(), z.unknown()).optional(),

        // カテゴリ2: 属性・ライフスタイル
        livingArrangement: z.enum(["WITH_FAMILY", "ALONE", "OTHER"]).optional(),
        transportation: z.enum(["CAR", "TRAIN", "OTHER"]).optional(),
        needsPickup: z.boolean().optional(),
        hasTattoo: z.boolean().optional(),
        dressAvailability: z.enum(["OWNED", "RENTAL"]).optional(),
        hasBoyfriend: z.boolean().optional(),
        hasHusband: z.boolean().optional(),
        hasChildren: z.boolean().optional(),

        // カテゴリ3: キャリア・身体情報
        currentOccupation: z.string().max(100).optional(),
        height: z.number().min(100).max(250).optional(),
        weight: z.number().min(30).max(200).optional(),
        bust: z.number().min(50).max(150).optional(),
        waist: z.number().min(40).max(120).optional(),
        hip: z.number().min(50).max(150).optional(),
        cupSize: z.string().optional(),
        languageSkills: z.record(z.string(), z.unknown()).optional(),
        cosmeticSurgery: z.string().max(500).optional(),

        // カテゴリ4: 業務アンケート
        birthdayEventWillingness: z.boolean().optional(),
        photoPublicationConsent: z.boolean().optional(),
        familyApproval: z.boolean().optional(),

        // カテゴリ5: 希望条件（追加分）
        shiftPreferences: z.record(z.string(), z.unknown()).optional(),
        motivation: z.string().max(1000).optional(),
        storePreferences: z.string().max(500).optional(),
        customerCount: z.number().min(0).optional(),
        salesTarget: z.number().min(0).optional(),
        previousStorePerformance: z.string().max(500).optional(),
        guaranteedHourlyRate: z.number().min(0).optional(),
        guaranteePeriod: z.string().max(100).optional(),
        specialConditions: z.string().max(500).optional(),

        // カテゴリ6: 職歴
        workHistories: z.array(z.object({
          storeName: z.string().min(1),
          hourlyRate: z.number().min(0).optional(),
          monthlySales: z.number().min(0).optional(),
          durationMonths: z.number().min(0).optional(),
          exitDate: z.string().optional(),
          exitReason: z.string().max(500).optional(),
          notes: z.string().max(1000).optional(),
        })).optional(),

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

      // 日付のパース（追加分）
      const interviewDate = input.interviewDate
        ? new Date(input.interviewDate)
        : undefined;
      const trialDate = input.trialDate
        ? new Date(input.trialDate)
        : undefined;

      const emergencyContact = input.emergencyContact as
        | Prisma.InputJsonValue
        | undefined;
      const languageSkills = input.languageSkills as
        | Prisma.InputJsonValue
        | undefined;
      const shiftPreferences = input.shiftPreferences as
        | Prisma.InputJsonValue
        | undefined;

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
        // カテゴリ1: 追加フィールド
        fullName: input.fullName,
        furigana: input.furigana,
        gender: input.gender,
        currentArea: input.currentArea,
        permanentAddress: input.permanentAddress,
        phoneNumber: input.phoneNumber,
        bloodType: input.bloodType,
        zodiacSign: input.zodiacSign,
        email: input.email || null,
        pcEmail: input.pcEmail || null,
        facebookId: input.facebookId,
        twitterId: input.twitterId,
        tiktokId: input.tiktokId,
        hobbies: input.hobbies,
        specialSkills: input.specialSkills,
        medicalConditions: input.medicalConditions,
        debt: input.debt,
        qualifications: input.qualifications,
        interviewDate,
        trialDate,
        employmentStatus: input.employmentStatus,
        emergencyContact,
        // カテゴリ2: 属性
        livingArrangement: input.livingArrangement,
        transportation: input.transportation,
        needsPickup: input.needsPickup,
        hasTattoo: input.hasTattoo,
        dressAvailability: input.dressAvailability,
        hasBoyfriend: input.hasBoyfriend,
        hasHusband: input.hasHusband,
        hasChildren: input.hasChildren,
        // カテゴリ3: キャリア・身体情報
        currentOccupation: input.currentOccupation,
        height: input.height,
        weight: input.weight,
        bust: input.bust,
        waist: input.waist,
        hip: input.hip,
        cupSize: input.cupSize,
        languageSkills,
        cosmeticSurgery: input.cosmeticSurgery,
        // カテゴリ4: 業務アンケート
        birthdayEventWillingness: input.birthdayEventWillingness,
        photoPublicationConsent: input.photoPublicationConsent,
        familyApproval: input.familyApproval,
        // カテゴリ5: 追加フィールド
        shiftPreferences,
        motivation: input.motivation,
        storePreferences: input.storePreferences,
        customerCount: input.customerCount,
        salesTarget: input.salesTarget,
        previousStorePerformance: input.previousStorePerformance,
        guaranteedHourlyRate: input.guaranteedHourlyRate,
        guaranteePeriod: input.guaranteePeriod,
        specialConditions: input.specialConditions,
      };

      const cast = await ctx.prisma.cast.upsert({
        where: { userId: ctx.session.user.id },
        update: profileData,
        create: {
          userId: ctx.session.user.id,
          ...profileData,
        },
      });

      // 経験・職歴データの更新（トランザクションで一括処理）
      await ctx.prisma.$transaction(async (tx) => {
        // 経験データ: undefined=変更なし, []=全削除, [...]= 全削除して再作成
        if (input.experiences !== undefined) {
          await tx.castExperience.deleteMany({
            where: { castId: cast.id },
          });

          if (input.experiences.length > 0) {
            await tx.castExperience.createMany({
              data: input.experiences.map((exp) => ({
                castId: cast.id,
                area: exp.area,
                businessType: exp.businessType,
                durationMonths: exp.durationMonths,
              })),
            });
          }
        }

        // 職歴データ: undefined=変更なし, []=全削除, [...]= 全削除して再作成
        if (input.workHistories !== undefined) {
          await tx.castWorkHistory.deleteMany({
            where: { castId: cast.id },
          });

          if (input.workHistories.length > 0) {
            await tx.castWorkHistory.createMany({
              data: input.workHistories.map((wh) => ({
                castId: cast.id,
                storeName: wh.storeName,
                hourlyRate: wh.hourlyRate,
                monthlySales: wh.monthlySales,
                durationMonths: wh.durationMonths,
                exitDate: wh.exitDate,
                exitReason: wh.exitReason,
                notes: wh.notes,
              })),
            });
          }
        }
      });

      // LINEアカウントからlineUserIdを同期（未設定の場合のみ）
      if (!cast.lineUserId) {
        const lineAccount = await ctx.prisma.account.findFirst({
          where: { userId: ctx.session.user.id, provider: "line" },
          select: { providerAccountId: true },
        });
        if (lineAccount) {
          await ctx.prisma.cast.update({
            where: { id: cast.id },
            data: { lineUserId: lineAccount.providerAccountId },
          });
        }
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
              contactPhone: true,
              contactEmail: true,
              lineUrl: true,
              preferredContactMethod: true,
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

      // ACCEPTED以外のオファーでは店舗連絡先をマスク
      const store = {
        ...offer.store,
        contactPhone: offer.status === "ACCEPTED" ? offer.store.contactPhone : null,
        contactEmail: offer.status === "ACCEPTED" ? offer.store.contactEmail : null,
        lineUrl: offer.status === "ACCEPTED" ? offer.store.lineUrl : null,
        preferredContactMethod: offer.status === "ACCEPTED" ? offer.store.preferredContactMethod : null,
      };

      return { ...offer, store };
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
        select: {
          id: true,
          nickname: true,
          lineId: true,
          user: { select: { email: true, phone: true } },
        },
      });

      if (!cast) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "キャストプロフィールが見つかりません",
        });
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
            castLineId: cast.lineId ?? null,
            castPhone: cast.user?.phone ?? null,
            castEmail: cast.user?.email ?? null,
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
