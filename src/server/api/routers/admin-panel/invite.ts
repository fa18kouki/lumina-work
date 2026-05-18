import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { adminPanelProcedure } from "@/server/api/admin-panel-procedure";
import { createTRPCRouter } from "@/server/api/trpc";

const emailSchema = z.string().email().max(320);

const listInput = z
  .object({
    status: z.enum(["PENDING", "ACCEPTED", "REVOKED"]).optional(),
    take: z.number().int().min(1).max(200).default(100),
  })
  .default({ take: 100 });

function getInviteRedirectTo(): string | undefined {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!base) return undefined;
  return `${base.replace(/\/$/, "")}/o/invite/callback`;
}

async function sendSupabaseInvite(email: string) {
  const supabase = getSupabaseAdminClient();
  const redirectTo = getInviteRedirectTo();
  return supabase.auth.admin.inviteUserByEmail(
    email,
    redirectTo ? { redirectTo } : undefined,
  );
}

export const adminInviteRouter = createTRPCRouter({
  list: adminPanelProcedure.input(listInput).query(async ({ input, ctx }) => {
    return ctx.prisma.adminInvitation.findMany({
      where: input.status ? { status: input.status } : undefined,
      orderBy: { createdAt: "desc" },
      take: input.take,
    });
  }),

  create: adminPanelProcedure
    .input(z.object({ email: emailSchema }))
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.prisma.adminInvitation.findUnique({
        where: { email: input.email },
      });
      if (existing && existing.status !== "REVOKED") {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "この email にはすでに招待が存在します。再送が必要な場合は再送機能を使ってください。",
        });
      }

      const { data, error } = await sendSupabaseInvite(input.email);
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Supabase invite failed: ${error.message}`,
        });
      }
      const supabaseUserId = data.user?.id ?? null;
      const now = new Date();

      if (existing) {
        return ctx.prisma.adminInvitation.update({
          where: { email: input.email },
          data: {
            status: "PENDING",
            invitedByLabel: "admin",
            supabaseUserId,
            createdAt: now,
            lastSentAt: now,
            acceptedAt: null,
            revokedAt: null,
          },
        });
      }

      return ctx.prisma.adminInvitation.create({
        data: {
          email: input.email,
          status: "PENDING",
          invitedByLabel: "admin",
          supabaseUserId,
          lastSentAt: now,
        },
      });
    }),

  resend: adminPanelProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const invitation = await ctx.prisma.adminInvitation.findUnique({
        where: { id: input.id },
      });
      if (!invitation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (invitation.status === "ACCEPTED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "受諾済みの招待は再送できません",
        });
      }

      const { error } = await sendSupabaseInvite(invitation.email);
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Supabase resend failed: ${error.message}`,
        });
      }

      return ctx.prisma.adminInvitation.update({
        where: { id: input.id },
        data: {
          status: "PENDING",
          lastSentAt: new Date(),
          revokedAt: null,
        },
      });
    }),

  revoke: adminPanelProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const invitation = await ctx.prisma.adminInvitation.findUnique({
        where: { id: input.id },
      });
      if (!invitation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (invitation.status === "ACCEPTED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "受諾済みの招待は失効できません",
        });
      }

      if (invitation.supabaseUserId) {
        const supabase = getSupabaseAdminClient();
        const { error } = await supabase.auth.admin.deleteUser(
          invitation.supabaseUserId,
        );
        // 404 (すでに無い) は無視。それ以外は失敗扱い。
        if (error && error.status !== 404) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Supabase deleteUser failed: ${error.message}`,
          });
        }
      }

      return ctx.prisma.adminInvitation.update({
        where: { id: input.id },
        data: { status: "REVOKED", revokedAt: new Date() },
      });
    }),
});
