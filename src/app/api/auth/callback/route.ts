import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/server/db";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/o/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/o/login?error=missing_code", origin));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const response = NextResponse.redirect(new URL(next, origin));

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(
      new URL("/o/login?error=auth_failed", origin)
    );
  }

  // Prisma User が存在しなければ OWNER として作成し、Owner レコードも同時作成
  const existingUser = await prisma.user.findUnique({
    where: { supabaseAuthId: data.user.id },
  });

  if (!existingUser) {
    const newUser = await prisma.user.create({
      data: {
        email: data.user.email,
        emailVerified: data.user.email_confirmed_at
          ? new Date(data.user.email_confirmed_at)
          : null,
        role: "OWNER",
        supabaseAuthId: data.user.id,
      },
    });

    await prisma.owner.create({
      data: { userId: newUser.id },
    });
  }

  return response;
}
