import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/diagnosis",
  "/privacy",
  "/terms",
  "/tokushoho",
  "/store/login",
  "/store/register",
  "/store/forgot-password",
  "/store/reset-password",
  "/games",
];

function isPublicRoute(pathname: string): boolean {
  if (pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff2?)$/)) return true;

  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

async function hasSupabaseSession(req: NextRequest): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return false;

  const response = NextResponse.next();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  return !!user;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // 店舗ルート: Supabase Auth cookieを確認
  if (pathname.startsWith("/store")) {
    const hasSession = await hasSupabaseSession(req);
    if (!hasSession) {
      const url = new URL("/store/login", req.nextUrl.origin);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // キャスト・その他ルート: NextAuth cookieを確認
  const token =
    req.cookies.get("authjs.session-token") ??
    req.cookies.get("__Secure-authjs.session-token");

  if (!token) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
