import { redirect } from "next/navigation";
import {
  getCachedPrismaUserBySupabaseId,
  getCachedSupabaseUser,
} from "@/lib/auth-cached";
import { OwnerLayoutWrapper } from "@/components/layout/owner-layout-wrapper";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 認証ページはチェック不要
  // NOTE: layout では pathname を直接取れないため、
  // 認証ページ用のスキップは OwnerLayoutWrapper 側で行う。
  // ここでは Supabase セッションがない場合のみリダイレクト。

  // React cache 経由で取得することで、同一リクエスト内の tRPC context が
  // 同じ user / prismaUser を共有する。Supabase Auth API への HTTP と
  // Prisma クエリがそれぞれ 1 回に集約される。
  const user = await getCachedSupabaseUser();

  // Supabase セッションなし → ログインへ
  if (!user) {
    return <OwnerLayoutWrapper>{children}</OwnerLayoutWrapper>;
  }

  const prismaUser = await getCachedPrismaUserBySupabaseId(user.id);

  // Prisma User が存在しない、または OWNER でない → ログインへリダイレクト
  if (!prismaUser || prismaUser.role !== "OWNER") {
    redirect("/o/login?error=not_owner");
  }

  return <OwnerLayoutWrapper>{children}</OwnerLayoutWrapper>;
}
