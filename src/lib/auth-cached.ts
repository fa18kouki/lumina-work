import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase-auth";
import { prisma } from "@/server/db";

/**
 * リクエストスコープで Supabase Auth の getUser をメモ化する。
 *
 * Why: OWNER 側の /o/* 画面は middleware / layout / tRPC context の
 * 3 箇所でそれぞれ supabase.auth.getUser() を直列呼び出ししていた。
 * 1 リクエストで 3 往復 + Auth サーバの DB connection 上限 (advisor 警告
 * `auth_db_connections_absolute=10`) に当たり、本番で 30〜60 秒の遅延
 * が出ていた。React cache は同一リクエスト内で同一引数の関数結果を
 * 共有するため、layout と tRPC は同じ user オブジェクトを取り回せる。
 */
export const getCachedSupabaseUser = cache(async () => {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

/**
 * supabaseAuthId をキーに Prisma User をリクエストスコープで memoize する。
 *
 * Why: layout で role 判定、tRPC context で session 構築のために同一
 * リクエスト内で 2 回叩いていた。
 */
export const getCachedPrismaUserBySupabaseId = cache(
  async (supabaseAuthId: string) => {
    return prisma.user.findUnique({
      where: { supabaseAuthId },
      select: {
        id: true,
        email: true,
        image: true,
        role: true,
        deletedAt: true,
      },
    });
  },
);
