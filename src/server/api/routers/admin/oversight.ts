import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";
import {
  paginationInput,
  dateRangeInput,
  matchStatusEnum,
  interviewStatusEnum,
} from "./schemas";

/**
 * やりとり/面接監視ルーター
 */
export const adminOversightRouter = createTRPCRouter({
  /**
   * 全やりとり一覧（管理用）
   */
  listMatches: adminProcedure
    .input(
      paginationInput.merge(dateRangeInput).extend({
        status: matchStatusEnum.optional(),
        castId: z.string().optional(),
        storeId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const matches = await ctx.prisma.match.findMany({
        where: {
          ...(input.status && { status: input.status }),
          ...(input.castId && { castId: input.castId }),
          ...(input.storeId && { storeId: input.storeId }),
          ...(input.dateFrom && {
            createdAt: { gte: new Date(input.dateFrom) },
          }),
          ...(input.dateTo && {
            createdAt: { lte: new Date(input.dateTo) },
          }),
        },
        include: {
          cast: {
            select: {
              id: true,
              nickname: true,
              user: { select: { email: true } },
            },
          },
          store: {
            select: { id: true, name: true, area: true },
          },
          _count: { select: { messages: true } },
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined;
      if (matches.length > input.limit) {
        const nextItem = matches.pop();
        nextCursor = nextItem?.id;
      }

      return { matches, nextCursor };
    }),

  /**
   * 全面接一覧（管理用）
   */
  listInterviews: adminProcedure
    .input(
      paginationInput.merge(dateRangeInput).extend({
        status: interviewStatusEnum.optional(),
        castId: z.string().optional(),
        storeId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const interviews = await ctx.prisma.interview.findMany({
        where: {
          ...(input.status && { status: input.status }),
          ...(input.castId && { castId: input.castId }),
          ...(input.storeId && { storeId: input.storeId }),
          ...(input.dateFrom && {
            scheduledAt: { gte: new Date(input.dateFrom) },
          }),
          ...(input.dateTo && {
            scheduledAt: { lte: new Date(input.dateTo) },
          }),
        },
        include: {
          cast: {
            select: {
              id: true,
              nickname: true,
              penaltyCount: true,
            },
          },
          store: {
            select: { id: true, name: true, area: true },
          },
          offer: {
            select: { id: true, message: true },
          },
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { scheduledAt: "desc" },
      });

      let nextCursor: string | undefined;
      if (interviews.length > input.limit) {
        const nextItem = interviews.pop();
        nextCursor = nextItem?.id;
      }

      return { interviews, nextCursor };
    }),

  /**
   * 面接ステータス更新（管理者権限）
   */
  updateInterviewStatus: adminProcedure
    .input(
      z.object({
        interviewId: z.string(),
        status: interviewStatusEnum,
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const interview = await ctx.prisma.interview.findUnique({
        where: { id: input.interviewId },
      });

      if (!interview) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "面接が見つかりません",
        });
      }

      const updated = await ctx.prisma.interview.update({
        where: { id: input.interviewId },
        data: {
          status: input.status,
          notes: input.notes
            ? `${interview.notes ?? ""}\n[管理者] ${input.notes}`
            : interview.notes,
        },
      });

      return { interview: updated };
    }),
});
