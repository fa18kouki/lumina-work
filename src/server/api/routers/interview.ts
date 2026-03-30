import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { dispatchNotification } from "@/server/notifications";

export const interviewRouter = createTRPCRouter({
  /**
   * 面接予約
   */
  schedule: protectedProcedure
    .input(
      z.object({
        offerId: z.string(),
        scheduledAt: z.string().datetime(),
        notes: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const offer = await ctx.prisma.offer.findUnique({
        where: { id: input.offerId },
        include: {
          cast: {
            select: {
              id: true,
              userId: true,
              nickname: true,
              lineUserId: true,
              user: { select: { email: true } },
            },
          },
          store: {
            select: {
              id: true,
              name: true,
              address: true,
              owner: {
                select: {
                  userId: true,
                  user: { select: { email: true } },
                },
              },
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

      // オファーが承諾済みか確認
      if (offer.status !== "ACCEPTED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "オファーが承諾されていません",
        });
      }

      // 権限確認（オファーに関連するユーザーのみ）
      const isRelated =
        offer.cast.userId === ctx.session.user.id ||
        offer.store.owner.userId === ctx.session.user.id;

      if (!isRelated) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "このオファーに対する権限がありません",
        });
      }

      const interview = await ctx.prisma.interview.create({
        data: {
          offerId: input.offerId,
          castId: offer.cast.id,
          storeId: offer.store.id,
          scheduledAt: new Date(input.scheduledAt),
          notes: input.notes,
        },
      });

      // キャスト向け通知
      await dispatchNotification({
        type: "INTERVIEW_SCHEDULED_CAST",
        payload: {
          recipientUserId: offer.cast.userId,
          interviewId: interview.id,
          castLineUserId: offer.cast.lineUserId,
          castEmail: offer.cast.user.email,
          storeName: offer.store.name,
          storeAddress: offer.store.address ?? "",
          scheduledAt: input.scheduledAt,
        },
      });

      // 店舗向け通知
      await dispatchNotification({
        type: "INTERVIEW_SCHEDULED_STORE",
        payload: {
          recipientUserId: offer.store.owner.userId,
          interviewId: interview.id,
          storeEmail: offer.store.owner.user.email,
          castNickname: offer.cast.nickname ?? "キャスト",
          scheduledAt: input.scheduledAt,
        },
      });

      return interview;
    }),

  /**
   * 面接一覧取得
   */
  getInterviews: protectedProcedure
    .input(
      z.object({
        status: z
          .enum(["SCHEDULED", "COMPLETED", "NO_SHOW", "CANCELLED"])
          .optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          cast: { select: { id: true } },
          owner: { select: { stores: { select: { id: true } } } },
        },
      });

      const castId = user?.cast?.id;
      const storeIds = user?.owner?.stores.map((s) => s.id) ?? [];

      if (!castId && storeIds.length === 0) {
        return { interviews: [], nextCursor: undefined };
      }

      const interviews = await ctx.prisma.interview.findMany({
        where: {
          OR: [
            ...(castId ? [{ castId }] : []),
            ...(storeIds.length > 0 ? [{ storeId: { in: storeIds } }] : []),
          ],
          ...(input.status && { status: input.status }),
        },
        include: {
          cast: {
            select: {
              id: true,
              nickname: true,
              age: true,
              rank: true,
              photos: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
              area: true,
            },
          },
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { scheduledAt: "asc" },
      });

      let nextCursor: string | undefined;
      if (interviews.length > input.limit) {
        const nextItem = interviews.pop();
        nextCursor = nextItem?.id;
      }

      return {
        interviews,
        nextCursor,
      };
    }),

  /**
   * 面接キャンセル
   */
  cancel: protectedProcedure
    .input(
      z.object({
        interviewId: z.string(),
        reason: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          cast: { select: { id: true } },
          owner: { select: { stores: { select: { id: true } } } },
        },
      });

      const castId = user?.cast?.id;
      const storeId = user?.owner?.stores[0]?.id;

      const interview = await ctx.prisma.interview.findFirst({
        where: {
          id: input.interviewId,
          OR: [
            { castId: castId ?? "" },
            { storeId: storeId ?? "" },
          ],
          status: "SCHEDULED",
        },
        include: {
          cast: {
            select: {
              userId: true,
              nickname: true,
              lineUserId: true,
              user: { select: { email: true } },
            },
          },
          store: {
            select: {
              name: true,
              owner: {
                select: {
                  userId: true,
                  user: { select: { email: true } },
                },
              },
            },
          },
        },
      });

      if (!interview) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "面接が見つからないか、キャンセルできません",
        });
      }

      const result = await ctx.prisma.interview.update({
        where: { id: input.interviewId },
        data: {
          status: "CANCELLED",
          notes: input.reason
            ? `${interview.notes ?? ""}\n[キャンセル理由] ${input.reason}`
            : interview.notes,
        },
      });

      const scheduledAt = interview.scheduledAt.toISOString();

      // キャンセルした側の相手方に通知
      const isCancelledByStore = storeId === interview.storeId;

      if (isCancelledByStore) {
        // 店舗がキャンセル → キャストに通知
        await dispatchNotification({
          type: "INTERVIEW_CANCELLED_CAST",
          payload: {
            recipientUserId: interview.cast.userId,
            interviewId: interview.id,
            castLineUserId: interview.cast.lineUserId,
            castEmail: interview.cast.user.email,
            storeName: interview.store.name,
            scheduledAt,
          },
        });
      } else {
        // キャストがキャンセル → 店舗に通知
        await dispatchNotification({
          type: "INTERVIEW_CANCELLED_STORE",
          payload: {
            recipientUserId: interview.store.owner.userId,
            interviewId: interview.id,
            storeEmail: interview.store.owner.user.email,
            castNickname: interview.cast.nickname ?? "キャスト",
            scheduledAt,
          },
        });
      }

      return result;
    }),

  /**
   * 面接完了
   */
  complete: protectedProcedure
    .input(
      z.object({
        interviewId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { owner: { select: { stores: { select: { id: true } } } } },
      });

      const storeId = user?.owner?.stores[0]?.id;

      if (!storeId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "店舗のみ面接を完了にできます",
        });
      }

      const interview = await ctx.prisma.interview.findFirst({
        where: {
          id: input.interviewId,
          storeId,
          status: "SCHEDULED",
        },
        include: {
          cast: {
            select: {
              userId: true,
              lineUserId: true,
            },
          },
          store: {
            select: { name: true },
          },
        },
      });

      if (!interview) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "面接が見つかりません",
        });
      }

      const result = await ctx.prisma.interview.update({
        where: { id: input.interviewId },
        data: { status: "COMPLETED" },
      });

      // キャストに面接完了通知
      await dispatchNotification({
        type: "INTERVIEW_COMPLETED",
        payload: {
          recipientUserId: interview.cast.userId,
          interviewId: interview.id,
          castLineUserId: interview.cast.lineUserId,
          storeName: interview.store.name,
        },
      });

      return result;
    }),

  /**
   * 無断欠席報告
   */
  reportNoShow: protectedProcedure
    .input(
      z.object({
        interviewId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { owner: { select: { stores: { select: { id: true } } } } },
      });

      const storeId = user?.owner?.stores[0]?.id;

      if (!storeId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "店舗のみ無断欠席を報告できます",
        });
      }

      const interview = await ctx.prisma.interview.findFirst({
        where: {
          id: input.interviewId,
          storeId,
          status: "SCHEDULED",
        },
        include: {
          cast: {
            select: {
              id: true,
              userId: true,
              penaltyCount: true,
              lineUserId: true,
              user: { select: { email: true } },
            },
          },
          store: { select: { name: true } },
        },
      });

      if (!interview) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "面接が見つかりません",
        });
      }

      const newPenaltyCount = interview.cast.penaltyCount + 1;

      // トランザクションで更新
      await ctx.prisma.$transaction([
        // 面接ステータスを更新
        ctx.prisma.interview.update({
          where: { id: input.interviewId },
          data: { status: "NO_SHOW" },
        }),
        // キャストのペナルティカウントを増加
        ctx.prisma.cast.update({
          where: { id: interview.cast.id },
          data: {
            penaltyCount: { increment: 1 },
            // 3回以上で利用停止
            isSuspended: newPenaltyCount >= 3,
          },
        }),
        // ペナルティ記録を作成
        ctx.prisma.penalty.create({
          data: {
            userId: interview.cast.userId,
            type: "NO_SHOW",
            interviewId: interview.id,
            reason: "面接の無断欠席",
          },
        }),
      ]);

      // キャストにノーショー通知
      await dispatchNotification({
        type: "NO_SHOW_REPORTED",
        payload: {
          recipientUserId: interview.cast.userId,
          interviewId: interview.id,
          castLineUserId: interview.cast.lineUserId,
          castEmail: interview.cast.user.email,
          storeName: interview.store.name,
          penaltyCount: newPenaltyCount,
        },
      });

      // 3回以上でアカウント停止通知も送信
      if (newPenaltyCount >= 3) {
        await dispatchNotification({
          type: "ACCOUNT_SUSPENDED",
          payload: {
            recipientUserId: interview.cast.userId,
            castEmail: interview.cast.user.email,
          },
        });
      }

      return { success: true };
    }),
});
