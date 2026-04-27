import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getCachedPrismaUserBySupabaseId,
  getCachedSupabaseUser,
} from "@/lib/auth-cached";
import { OwnerLayoutWrapper } from "@/components/layout/owner-layout-wrapper";

const OWNER_AUTH_PAGES = [
  "/o/login",
  "/o/register",
  "/o/forgot-password",
  "/o/reset-password",
];

function isOwnerAuthPage(pathname: string | null): boolean {
  if (!pathname) return false;
  return OWNER_AUTH_PAGES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // middleware が x-pathname header を埋めてくれている (リダイレクトループ防止)。
  const headerList = await headers();
  const pathname = headerList.get("x-pathname");
  const onAuthPage = isOwnerAuthPage(pathname);

  // React cache 経由で取得することで、同一リクエスト内の tRPC context が
  // 同じ user / prismaUser を共有する。Supabase Auth API への HTTP と
  // Prisma クエリがそれぞれ 1 回に集約される。
  const user = await getCachedSupabaseUser();

  // Supabase セッションなし → wrapper にフォールバック
  // (未認証なら middleware が既に /o/login へ送っているはずで、ここに来るのは認証ページのみ)
  if (!user) {
    return <OwnerLayoutWrapper>{children}</OwnerLayoutWrapper>;
  }

  const prismaUser = await getCachedPrismaUserBySupabaseId(user.id);

  // Prisma User が存在しない、または OWNER でない:
  //   - 既に /o/login 等の認証ページ上 → リダイレクトせずレンダリング
  //     (旧コードは /o/login → layout → redirect /o/login の無限ループを起こしていた)
  //   - その他のページ → /o/login?error=not_owner へ送る
  if (!prismaUser || prismaUser.role !== "OWNER") {
    if (onAuthPage) {
      return <OwnerLayoutWrapper>{children}</OwnerLayoutWrapper>;
    }
    redirect("/o/login?error=not_owner");
  }

  return <OwnerLayoutWrapper>{children}</OwnerLayoutWrapper>;
}
