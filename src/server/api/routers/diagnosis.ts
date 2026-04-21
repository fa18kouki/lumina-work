import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import type { DiagnosisAnswers } from "@/lib/diagnosis/types";
import {
  areRequiredQuestionsAnswered,
  calculateProgress,
} from "@/lib/diagnosis/question-flow";
import { calculateRank } from "@/lib/diagnosis/calculate-rank";

// 回答値のZodスキーマ
const answerValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.array(z.number()),
  z.null(),
]);

export const diagnosisRouter = createTRPCRouter({
  /**
   * 診断セッションを開始または再開
   */
  startSession: protectedProcedure.mutation(async ({ ctx }) => {
    // 既存のキャストプロフィールとセッションを確認
    const existingCast = await ctx.prisma.cast.findUnique({
      where: { userId: ctx.session.user.id },
      include: { diagnosisSession: true },
    });

    // キャストプロフィールがない場合は作成
    if (!existingCast) {
      const cast = await ctx.prisma.cast.create({
        data: {
          userId: ctx.session.user.id,
          nickname: "",
          age: 18,
          photos: [],
          desiredAreas: [],
        },
      });

      // ユーザーロールをCASTに設定
      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { role: "CAST" },
      });

      // 新しいセッションを作成
      const session = await ctx.prisma.diagnosisSession.create({
        data: {
          castId: cast.id,
          currentStep: "BASIC_INFO",
          answers: {},
        },
      });

      return {
        session,
        isNew: true,
        cast,
      };
    }

    // 既存セッションがあれば返す
    if (existingCast.diagnosisSession) {
      return {
        session: existingCast.diagnosisSession,
        isNew: false,
        cast: existingCast,
      };
    }

    // 診断済みの場合は完了状態のセッションを作成
    if (existingCast.diagnosisCompleted) {
      const session = await ctx.prisma.diagnosisSession.create({
        data: {
          castId: existingCast.id,
          currentStep: "AVAILABILITY",
          answers: {},
          isCompleted: true,
          completedAt: existingCast.diagnosisCompletedAt,
        },
      });

      return {
        session,
        isNew: false,
        cast: existingCast,
      };
    }

    // 新しいセッションを作成
    const session = await ctx.prisma.diagnosisSession.create({
      data: {
        castId: existingCast.id,
        currentStep: "BASIC_INFO",
        answers: {},
      },
    });

    return {
      session,
      isNew: true,
      cast: existingCast,
    };
  }),

  /**
   * 現在のセッションを取得
   */
  getSession: protectedProcedure.query(async ({ ctx }) => {
    const cast = await ctx.prisma.cast.findUnique({
      where: { userId: ctx.session.user.id },
      include: { diagnosisSession: true },
    });

    if (!cast) {
      return null;
    }

    return {
      session: cast.diagnosisSession,
      cast,
      progress: cast.diagnosisSession
        ? calculateProgress(
            (cast.diagnosisSession.answers as DiagnosisAnswers) || {}
          )
        : null,
    };
  }),

  /**
   * 回答を保存
   */
  saveAnswer: protectedProcedure
    .input(
      z.object({
        questionId: z.string(),
        value: answerValueSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const cast = await ctx.prisma.cast.findUnique({
        where: { userId: ctx.session.user.id },
        include: { diagnosisSession: true },
      });

      if (!cast) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "キャストプロフィールが見つかりません",
        });
      }

      if (!cast.diagnosisSession) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "診断セッションが見つかりません",
        });
      }

      // 現在の回答を取得して更新
      const currentAnswers =
        (cast.diagnosisSession.answers as DiagnosisAnswers) || {};
      const updatedAnswers = {
        ...currentAnswers,
        [input.questionId]: input.value,
      };

      // セッションを更新
      const updatedSession = await ctx.prisma.diagnosisSession.update({
        where: { id: cast.diagnosisSession.id },
        data: {
          answers: updatedAnswers as unknown as Prisma.InputJsonValue,
        },
      });

      // 進捗を計算
      const progress = calculateProgress(updatedAnswers);

      return {
        session: updatedSession,
        progress,
      };
    }),

  /**
   * ステップを更新
   */
  updateStep: protectedProcedure
    .input(
      z.object({
        step: z.enum([
          "BASIC_INFO",
          "CONTACT",
          "EXPERIENCE",
          "PREFERENCES",
          "SELF_PR",
          "AVAILABILITY",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const cast = await ctx.prisma.cast.findUnique({
        where: { userId: ctx.session.user.id },
        include: { diagnosisSession: true },
      });

      if (!cast || !cast.diagnosisSession) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "診断セッションが見つかりません",
        });
      }

      const updatedSession = await ctx.prisma.diagnosisSession.update({
        where: { id: cast.diagnosisSession.id },
        data: {
          currentStep: input.step,
        },
      });

      return updatedSession;
    }),

  /**
   * 診断を完了
   */
  completeDiagnosis: protectedProcedure.mutation(async ({ ctx }) => {
    const cast = await ctx.prisma.cast.findUnique({
      where: { userId: ctx.session.user.id },
      include: { diagnosisSession: true },
    });

    if (!cast || !cast.diagnosisSession) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "診断セッションが見つかりません",
      });
    }

    const answers = (cast.diagnosisSession.answers as DiagnosisAnswers) || {};

    // 必須項目のチェック
    if (!areRequiredQuestionsAnswered(answers)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "必須項目が入力されていません",
      });
    }

    const now = new Date();

    // 診断セッションを完了状態に更新
    await ctx.prisma.diagnosisSession.update({
      where: { id: cast.diagnosisSession.id },
      data: {
        isCompleted: true,
        completedAt: now,
      },
    });

    // 回答をCastプロフィールに反映
    const profileData: Prisma.CastUpdateInput = {
      diagnosisCompleted: true,
      diagnosisCompletedAt: now,
      rank: calculateRank({
        totalExperienceYears:
          typeof answers.totalExperienceYears === "number"
            ? answers.totalExperienceYears
            : undefined,
        desiredAreas: Array.isArray(answers.desiredAreas)
          ? (answers.desiredAreas as string[])
          : undefined,
        previousHourlyRate:
          typeof answers.previousHourlyRate === "number"
            ? answers.previousHourlyRate
            : undefined,
      }),
    };

    // 基本情報
    if (answers.nickname) profileData.nickname = answers.nickname;
    if (answers.age) profileData.age = answers.age as number;
    if (answers.birthDate) profileData.birthDate = new Date(answers.birthDate);
    if (answers.photos) profileData.photos = answers.photos;

    // 連絡先
    if (answers.instagramId) profileData.instagramId = answers.instagramId;
    if (answers.lineId) profileData.lineId = answers.lineId;
    if (answers.currentListingUrl)
      profileData.currentListingUrl = answers.currentListingUrl;

    // 経験・スキル
    if (answers.totalExperienceYears !== undefined)
      profileData.totalExperienceYears = Math.round(
        answers.totalExperienceYears as number
      );
    if (answers.previousHourlyRate !== undefined)
      profileData.previousHourlyRate = answers.previousHourlyRate as number;
    if (answers.monthlySales !== undefined)
      profileData.monthlySales =
        (answers.monthlySales as number) * 10000; // 万円から円に変換
    if (answers.monthlyNominations !== undefined)
      profileData.monthlyNominations = answers.monthlyNominations as number;
    if (answers.alcoholTolerance)
      profileData.alcoholTolerance = answers.alcoholTolerance as
        | "NONE"
        | "WEAK"
        | "MODERATE"
        | "STRONG";

    // 希望条件
    if (answers.desiredAreas)
      profileData.desiredAreas = answers.desiredAreas as string[];
    if (answers.desiredHourlyRate !== undefined)
      profileData.desiredHourlyRate = answers.desiredHourlyRate as number;
    if (answers.desiredMonthlyIncome !== undefined)
      profileData.desiredMonthlyIncome =
        (answers.desiredMonthlyIncome as number) * 10000; // 万円から円に変換
    if (answers.availableDaysPerWeek !== undefined)
      profileData.availableDaysPerWeek = Math.round(
        answers.availableDaysPerWeek as number
      );
    if (answers.preferredAtmosphere)
      profileData.preferredAtmosphere = answers.preferredAtmosphere as string[];
    if (answers.preferredClientele)
      profileData.preferredClientele = answers.preferredClientele as string[];

    // 自己PR
    if (answers.birthdaySales !== undefined)
      profileData.birthdaySales =
        (answers.birthdaySales as number) * 10000; // 万円から円に変換
    if (answers.hasVipClients !== undefined)
      profileData.hasVipClients = answers.hasVipClients as boolean;
    if (answers.vipClientDescription)
      profileData.vipClientDescription = answers.vipClientDescription;
    if (answers.socialFollowers !== undefined)
      profileData.socialFollowers = answers.socialFollowers as number;

    // 稼働状況
    if (answers.isAvailableNow !== undefined)
      profileData.isAvailableNow = answers.isAvailableNow as boolean;
    if (answers.downtimeUntil)
      profileData.downtimeUntil = new Date(answers.downtimeUntil);

    // Castプロフィールを更新
    const updatedCast = await ctx.prisma.cast.update({
      where: { id: cast.id },
      data: profileData,
    });

    return {
      cast: updatedCast,
      completedAt: now,
    };
  }),

  /**
   * 診断をリセット
   */
  resetDiagnosis: protectedProcedure.mutation(async ({ ctx }) => {
    const cast = await ctx.prisma.cast.findUnique({
      where: { userId: ctx.session.user.id },
      include: { diagnosisSession: true },
    });

    if (!cast) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "キャストプロフィールが見つかりません",
      });
    }

    // 既存セッションがあれば削除
    if (cast.diagnosisSession) {
      await ctx.prisma.diagnosisSession.delete({
        where: { id: cast.diagnosisSession.id },
      });
    }

    // 診断完了フラグをリセット
    await ctx.prisma.cast.update({
      where: { id: cast.id },
      data: {
        diagnosisCompleted: false,
        diagnosisCompletedAt: null,
      },
    });

    // 新しいセッションを作成
    const newSession = await ctx.prisma.diagnosisSession.create({
      data: {
        castId: cast.id,
        currentStep: "BASIC_INFO",
        answers: {},
      },
    });

    return {
      session: newSession,
    };
  }),
});
