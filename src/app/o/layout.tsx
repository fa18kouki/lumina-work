import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase-auth";
import { prisma } from "@/server/db";
import { OwnerLayoutWrapper } from "@/components/layout/owner-layout-wrapper";

/** 認証不要のパス */
const AUTH_PAGES = new Set([
  "/o/login",
  "/o/register",
  "/o/forgot-password",
  "/o/reset-password",
]);

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  // 認証ページはチェック不要
  // NOTE: layout では pathname を直接取れないため、
  // 認証ページ用のスキップは OwnerLayoutWrapper 側で行う。
  // ここでは Supabase セッションがない場合のみリダイレクト。

  const supabase = createServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Supabase セッションなし → ログインへ
  if (!user) {
    return <OwnerLayoutWrapper>{children}</OwnerLayoutWrapper>;
  }

  // Prisma User の role を確認
  const prismaUser = await prisma.user.findUnique({
    where: { supabaseAuthId: user.id },
    select: { role: true },
  });

  // Prisma User が存在しない、または OWNER でない → ログインへリダイレクト
  if (!prismaUser || prismaUser.role !== "OWNER") {
    redirect("/o/login?error=not_owner");
  }

  return <OwnerLayoutWrapper>{children}</OwnerLayoutWrapper>;
}
