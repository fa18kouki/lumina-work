import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

const emailSchema = z.string().email().max(320);

/**
 * オーナー新規登録の preflight (public)。
 *
 * `/o/register` で `supabase.auth.signUp` を叩く前に「その email が
 * 既に他経路で利用されていないか」を DB 側で確認する。Supabase の signUp は
 * 既存 email の場合に `identities: []` を返すだけで「自己登録済み」と
 * 「管理者から招待中」を区別できないため、誘導文言を出すために本エンドポイントを
 * 用意している。
 *
 * Trade-off: public endpoint なので email enumeration の余地はある。
 * 「曖昧な汎用メッセージで隠す」よりも「ユーザーを正しいフローへ誘導する」
 * 方針を優先する (UX 重視)。Rate limit は別レイヤーで対処する想定。
 */
export const authRouter = createTRPCRouter({
  preflightOwnerSignup: publicProcedure
    .input(z.object({ email: emailSchema }))
    .query(async ({ input, ctx }) => {
      // 1) 管理者から PENDING な招待が出ている email は signUp させない
      //    (招待リンク経由で登録すべきため)
      const invite = await ctx.prisma.adminInvitation.findUnique({
        where: { email: input.email },
        select: { status: true },
      });
      if (invite && invite.status === "PENDING") {
        return { ok: false as const, reason: "PENDING_INVITATION" as const };
      }

      // 2) 既に登録済み (soft-delete されていない) ユーザーが居る場合は弾く。
      //    OWNER と非 OWNER (CAST 等) で文言を分ける。
      const existingUser = await ctx.prisma.user.findFirst({
        where: { email: input.email, deletedAt: null },
        select: { role: true },
      });
      if (existingUser) {
        if (existingUser.role === "OWNER") {
          return {
            ok: false as const,
            reason: "ALREADY_REGISTERED" as const,
          };
        }
        return {
          ok: false as const,
          reason: "OTHER_ROLE_REGISTERED" as const,
        };
      }

      return { ok: true as const };
    }),
});
