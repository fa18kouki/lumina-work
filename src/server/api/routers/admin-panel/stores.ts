import { z } from "zod";

import { adminPanelProcedure } from "@/server/api/admin-panel-procedure";
import { createTRPCRouter } from "@/server/api/trpc";
import { paginationInput } from "../admin/schemas";

const listInput = paginationInput.extend({
  isVerified: z.boolean().optional(),
  area: z.string().trim().min(1).max(80).optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

export const adminStoresPanelRouter = createTRPCRouter({
  list: adminPanelProcedure.input(listInput).query(async ({ ctx, input }) => {
    const stores = await ctx.prisma.store.findMany({
      where: {
        deletedAt: null,
        ...(input.isVerified !== undefined && { isVerified: input.isVerified }),
        ...(input.area && { area: input.area }),
        ...(input.search && {
          name: { contains: input.search, mode: "insensitive" },
        }),
      },
      include: {
        owner: {
          select: {
            id: true,
            companyName: true,
            isVerified: true,
            user: {
              select: { id: true, email: true, phone: true },
            },
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
});
