import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";
import { paginationInput, userRoleEnum } from "./schemas";

/**
 * ユーザー管理ルーター
 */
export const adminUsersRouter = createTRPCRouter({
  /**
   * ユーザー一覧取得
   */
  list: adminProcedure
    .input(
      paginationInput.extend({
        role: userRoleEnum.optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const users = await ctx.prisma.user.findMany({
        where: {
          ...(input.role && { role: input.role }),
          ...(input.search && {
            OR: [
              { email: { contains: input.search, mode: "insensitive" } },
              { phone: { contains: input.search } },
            ],
          }),
        },
        include: {
          cast: {
            select: { id: true, nickname: true, isSuspended: true },
          },
          owner: {
            select: { id: true, stores: { select: { id: true, name: true } } },
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

  /**
   * ユーザー詳細取得
   */
  getById: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        include: {
          cast: true,
          owner: { include: { stores: true } },
          _count: { select: { sentMessages: true } },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ユーザーが見つかりません",
        });
      }

      return user;
    }),

  /**
   * ユーザーロール変更
   */
  updateRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: userRoleEnum,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ユーザーが見つかりません",
        });
      }

      const updated = await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });

      return { id: updated.id, role: updated.role };
    }),

  /**
   * ユーザー停止
   */
  suspend: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        include: { cast: true, owner: { include: { stores: true } } },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ユーザーが見つかりません",
        });
      }

      // キャストの場合は停止フラグを更新
      if (user.cast) {
        await ctx.prisma.cast.update({
          where: { id: user.cast.id },
          data: { isSuspended: true },
        });
      }

      // 停止理由があればペナルティを記録
      if (input.reason) {
        await ctx.prisma.penalty.create({
          data: {
            userId: input.userId,
            type: "OTHER",
            reason: input.reason,
          },
        });
      }

      return { success: true };
    }),

  /**
   * ユーザー停止解除
   */
  unsuspend: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        include: { cast: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ユーザーが見つかりません",
        });
      }

      // キャストの場合は停止フラグを解除
      if (user.cast) {
        await ctx.prisma.cast.update({
          where: { id: user.cast.id },
          data: { isSuspended: false },
        });
      }

      return { success: true };
    }),
});
