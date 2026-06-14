import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminPanelProcedure } from "@/server/api/admin-panel-procedure";
import { createTRPCRouter } from "@/server/api/trpc";
import { paginationInput, userRoleEnum } from "../admin/schemas";

const listInput = paginationInput.extend({
  role: userRoleEnum.optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

const castCsvColumns = [
  "user_id",
  "cast_id",
  "email",
  "phone",
  "nickname",
  "full_name",
  "age",
  "birth_date",
  "rank",
  "id_verified",
  "is_suspended",
  "desired_areas",
  "desired_hourly_rate",
  "desired_monthly_income",
  "available_days_per_week",
  "instagram_id",
  "line_id",
  "created_at",
] as const;

function formatCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.join(" / ");
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildCsv(rows: unknown[][]): string {
  return [castCsvColumns, ...rows]
    .map((row) => row.map(formatCsvValue).join(","))
    .join("\n");
}

type SoftDeleteAdminUserTx = {
  owner: {
    findUnique: (args: { where: { userId: string }; select: { id: true } }) => Promise<{ id: string } | null>;
    updateMany: (args: {
      where: { id: string; deletedAt: null };
      data: { deletedAt: Date };
    }) => Promise<unknown>;
  };
  store: {
    updateMany: (args: {
      where: { ownerId: string; deletedAt: null };
      data: { deletedAt: Date };
    }) => Promise<unknown>;
  };
  user: {
    update: (args: {
      where: { id: string };
      data: { deletedAt: Date };
      select: { id: true; deletedAt: true };
    }) => Promise<{ id: string; deletedAt: Date | null }>;
  };
};

export async function softDeleteAdminUserWithRelations(
  tx: SoftDeleteAdminUserTx,
  input: { userId: string; role: "CAST" | "OWNER" | "ADMIN" },
  now = new Date(),
): Promise<{ id: string; deletedAt: Date | null }> {
  if (input.role === "OWNER") {
    const owner = await tx.owner.findUnique({
      where: { userId: input.userId },
      select: { id: true },
    });

    if (owner) {
      await tx.store.updateMany({
        where: { ownerId: owner.id, deletedAt: null },
        data: { deletedAt: now },
      });
      await tx.owner.updateMany({
        where: { id: owner.id, deletedAt: null },
        data: { deletedAt: now },
      });
    }
  }

  return tx.user.update({
    where: { id: input.userId },
    data: { deletedAt: now },
    select: { id: true, deletedAt: true },
  });
}

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

  exportCastsCsv: adminPanelProcedure.mutation(async ({ ctx }) => {
    const casts = await ctx.prisma.user.findMany({
      where: { role: "CAST", deletedAt: null },
      include: {
        cast: {
          select: {
            id: true,
            nickname: true,
            fullName: true,
            age: true,
            birthDate: true,
            rank: true,
            idVerified: true,
            isSuspended: true,
            desiredAreas: true,
            desiredHourlyRate: true,
            desiredMonthlyIncome: true,
            availableDaysPerWeek: true,
            instagramId: true,
            lineId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const csv = buildCsv(
      casts.map((user) => [
        user.id,
        user.cast?.id,
        user.email,
        user.phone,
        user.cast?.nickname,
        user.cast?.fullName,
        user.cast?.age,
        user.cast?.birthDate,
        user.cast?.rank,
        user.cast?.idVerified,
        user.cast?.isSuspended,
        user.cast?.desiredAreas,
        user.cast?.desiredHourlyRate,
        user.cast?.desiredMonthlyIncome,
        user.cast?.availableDaysPerWeek,
        user.cast?.instagramId,
        user.cast?.lineId,
        user.createdAt,
      ]),
    );

    return {
      filename: `lumina-casts-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
      count: casts.length,
    };
  }),

  softDelete: adminPanelProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findFirst({
        where: { id: input.userId, deletedAt: null },
        select: { id: true, role: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ユーザーが見つかりません",
        });
      }

      if (existing.role === "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "管理者ユーザーは画面から削除できません",
        });
      }

      const deleted = await ctx.prisma.$transaction((tx) =>
        softDeleteAdminUserWithRelations(tx, {
          userId: input.userId,
          role: existing.role,
        }),
      );

      return { success: true, userId: deleted.id, deletedAt: deleted.deletedAt };
    }),
});
