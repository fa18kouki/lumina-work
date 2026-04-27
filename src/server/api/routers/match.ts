import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const matchRouter = createTRPCRouter({
  /**
   * やりとり一覧取得
   */
  getMatches: protectedProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "ACCEPTED", "REJECTED"]).optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true, cast: { select: { id: true } }, owner: { select: { stores: { select: { id: true } } } } },
      });

      if (!user) {
        return { matches: [], nextCursor: undefined };
      }

      const isCast = user.role === "CAST";
      const castId = user.cast?.id;
      const storeIds = user.owner?.stores.map((s) => s.id) ?? [];

      if (isCast ? !castId : storeIds.length === 0) {
        return { matches: [], nextCursor: undefined };
      }

      const matches = await ctx.prisma.match.findMany({
        where: {
          ...(isCast
            ? { castId: castId ?? "" }
            : { storeId: { in: storeIds } }),
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
        orderBy: { updatedAt: "desc" },
      });

      let nextCursor: string | undefined;
      if (matches.length > input.limit) {
        const nextItem = matches.pop();
        nextCursor = nextItem?.id;
      }

      return {
        matches,
        nextCursor,
      };
    }),

  /**
   * ステータス更新
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        matchId: z.string(),
        status: z.enum(["ACCEPTED", "REJECTED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { cast: { select: { id: true } }, owner: { select: { stores: { select: { id: true } } } } },
      });

      const castId = user?.cast?.id;
      const storeIds = user?.owner?.stores.map((s) => s.id) ?? [];

      const orClauses: Array<Record<string, unknown>> = [];
      if (castId) orClauses.push({ castId });
      if (storeIds.length > 0) orClauses.push({ storeId: { in: storeIds } });

      if (orClauses.length === 0) {
        throw new Error("該当するやりとりが見つかりません");
      }

      // 自分に関連するか確認 (複数店舗 OWNER も全店舗カバー)
      const match = await ctx.prisma.match.findFirst({
        where: {
          id: input.matchId,
          OR: orClauses,
        },
      });

      if (!match) {
        throw new Error("該当するやりとりが見つかりません");
      }

      return ctx.prisma.match.update({
        where: { id: input.matchId },
        data: { status: input.status },
      });
    }),
});
