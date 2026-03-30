import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";
import { paginationInput } from "./schemas";

/**
 * 店舗管理ルーター
 */
export const adminStoresRouter = createTRPCRouter({
  /**
   * 店舗一覧取得
   */
  list: adminProcedure
    .input(
      paginationInput.extend({
        isVerified: z.boolean().optional(),
        area: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const stores = await ctx.prisma.store.findMany({
        where: {
          ...(input.isVerified !== undefined && {
            isVerified: input.isVerified,
          }),
          ...(input.area && { area: input.area }),
          ...(input.search && {
            name: { contains: input.search, mode: "insensitive" },
          }),
        },
        include: {
          owner: {
            select: {
              user: { select: { id: true, email: true } },
            },
          },
          _count: {
            select: { matches: true, offers: true, interviews: true },
          },
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

      return { stores, nextCursor };
    }),

  /**
   * 店舗詳細取得
   */
  getById: adminProcedure
    .input(z.object({ storeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const store = await ctx.prisma.store.findUnique({
        where: { id: input.storeId },
        include: {
          owner: {
            select: {
              user: {
                select: {
                  id: true,
                  email: true,
                  phone: true,
                  createdAt: true,
                },
              },
            },
          },
          _count: {
            select: { matches: true, offers: true, interviews: true },
          },
        },
      });

      if (!store) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "店舗が見つかりません",
        });
      }

      return store;
    }),

  /**
   * 店舗認証
   */
  verify: adminProcedure
    .input(
      z.object({
        storeId: z.string(),
        verified: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const store = await ctx.prisma.store.findUnique({
        where: { id: input.storeId },
      });

      if (!store) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "店舗が見つかりません",
        });
      }

      const updated = await ctx.prisma.store.update({
        where: { id: input.storeId },
        data: { isVerified: input.verified },
      });

      return { id: updated.id, isVerified: updated.isVerified };
    }),
});
