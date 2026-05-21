import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminPanelProcedure } from "@/server/api/admin-panel-procedure";
import { createTRPCRouter } from "@/server/api/trpc";
import { paginationInput, userRoleEnum } from "../admin/schemas";

const listInput = paginationInput.extend({
  role: userRoleEnum.optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

export const adminUsersPanelRouter = createTRPCRouter({
  list: adminPanelProcedure.input(listInput).query(async ({ ctx, input }) => {
    const users = await ctx.prisma.user.findMany({
      where: {
        deletedAt: null,
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
          select: {
            id: true,
            nickname: true,
            rank: true,
            isSuspended: true,
            idVerified: true,
          },
        },
        owner: {
          select: {
            id: true,
            companyName: true,
            stores: { select: { id: true, name: true } },
          },
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

  getById: adminPanelProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findFirst({
        where: { id: input.userId, deletedAt: null },
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
});
