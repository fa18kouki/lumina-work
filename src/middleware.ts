import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = [
  "/",
  "/c/login",
  "/c/register",
  "/diagnosis",
  "/privacy",
  "/terms",
  "/tokushoho",
  "/o/login",
  "/o/register",
  "/o/forgot-password",
  "/o/reset-password",
  // 旧 /s/ 認証ルート（リダイレクト用に残す）
  "/s/login",
  "/s/register",
  "/s/forgot-password",
  "/s/reset-password",
  "/games",
];

// キャストの Supabase マジックリンク完了用（hash でセッションが渡るため認証前にアクセスする）
const isLoginCallback = (pathname: string) => pathname === "/c/login/callback";

function isPublicRoute(pathname: string): boolean {
  if (pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff2?)$/)) return true;

  if (isLoginCallback(pathname)) return true;
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

/**
 * Supabase の SSR cookie が存在するかだけを確認する軽量チェック。
 *
 * Why: middleware は edge runtime で 1 リクエストあたり 1 回確実に走る。
 * かつて `supabase.auth.getUser()` を呼んで Supabase Auth API へ HTTP を
 * 投げていたため、本番 OWNER の体感遅延 (30〜60s) の主要因の 1 つに
 * なっていた。React `cache()` も edge runtime では効かない。middleware
 * では「cookie があるか」だけを確認してリクエストを通し、本物のセッション
 * 検証は server layout / tRPC context (auth-cached 経由) に委ねる。
 *
 * Trade-off: 期限切れ / 改竄された cookie は middleware を素通りするが、
 * 続く layout で必ず再検証されてリダイレクトされるため、認可的な抜け
 * 道は無い。代わりに往復が 1 回減って体感速度が大幅に改善する。
 */
function hasSupabaseSessionCookie(req: NextRequest): boolean {
  for (const c of req.cookies.getAll()) {
    if (c.name.startsWith("sb-") && c.name.endsWith("-auth-token")) {
      return true;
    }
  }
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // server layout が現在の pathname を読めるよう header に転写
  // (next/headers の cookies/headers から取り出す。リダイレクトループ判定に使用)
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  const passThrough = NextResponse.next({ request: { headers: requestHeaders } });

  if (isPublicRoute(pathname)) {
    return passThrough;
  }

  // 旧 /s/ ルートは /o/ にリダイレクト
  if (pathname.startsWith("/s/")) {
    const newPath = pathname.replace(/^\/s\//, "/o/");
    return NextResponse.redirect(new URL(newPath, req.nextUrl.origin));
  }

  // オーナールート: Supabase Auth cookie の有無のみチェック
  if (pathname.startsWith("/o")) {
    if (!hasSupabaseSessionCookie(req)) {
      const url = new URL("/o/login", req.nextUrl.origin);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    return passThrough;
  }

  // キャスト・その他ルート: NextAuth または Supabase セッション cookie を確認
  const hasNextAuth =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token");

  if (!hasNextAuth && !hasSupabaseSessionCookie(req)) {
    const url = new URL("/c/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return passThrough;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
