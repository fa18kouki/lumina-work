import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/server/db";
import { REFERRAL_CONFIG } from "@/lib/constants";
import { resolveNextUrl } from "@/app/api/auth/callback/resolve-next-url";

const DEFAULT_NEXT = "/o/dashboard";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = resolveNextUrl(searchParams.get("next"), origin, DEFAULT_NEXT);
  const refCode = searchParams.get("ref");

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

  // 1) コードをセッションに交換。
  //    既にセッション cookie がある状態で同じ callback URL を再訪 (リロード等) すると
  //    code は使い捨てなので失敗する。その場合でも有効な session があれば素直に next へ流す。
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  let supabaseUser = data?.user ?? null;

  if (error || !supabaseUser) {
    const { data: existing } = await supabase.auth.getUser();
    if (existing?.user) {
      supabaseUser = existing.user;
    } else {
      console.warn("[auth/callback] exchange failed and no active session", {
        message: error?.message,
      });
      return NextResponse.redirect(
        new URL("/o/login?error=auth_failed", origin),
      );
    }
  }

  // 2) Prisma User を冪等に upsert。create が落ちると orphan auth.users が残るため、
  //    transaction で User+Owner+Subscription をまとめて作る。失敗時は明示的にエラー
  //    リダイレクトしてログを残す (silent skip しない)。
  try {
    const existingUser = await prisma.user.findUnique({
      where: { supabaseAuthId: supabaseUser.id },
      select: { id: true },
    });

    if (!existingUser) {
      const newOwner = await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email: supabaseUser.email,
            emailVerified: supabaseUser.email_confirmed_at
              ? new Date(supabaseUser.email_confirmed_at)
              : null,
            role: "OWNER",
            supabaseAuthId: supabaseUser.id,
          },
        });

        const createdOwner = await tx.owner.create({
          data: {
            userId: createdUser.id,
            subscription: {
              create: { plan: "FREE", status: "ACTIVE", offerLimit: 3 },
            },
          },
        });

        return createdOwner;
      });

      // リファーラルコードの処理 (失敗しても本体ログインは妨げない)
      if (refCode) {
        try {
          const referrer = await prisma.owner.findUnique({
            where: { referralCode: refCode.toUpperCase() },
            select: { id: true },
          });

          if (referrer && referrer.id !== newOwner.id) {
            const expiresAt = new Date();
            expiresAt.setDate(
              expiresAt.getDate() + REFERRAL_CONFIG.expirationDays,
            );

            await prisma.referral.create({
              data: {
                referrerOwnerId: referrer.id,
                referredOwnerId: newOwner.id,
                code: refCode.toUpperCase(),
                status: "PENDING",
                expiresAt,
              },
            });
          }
        } catch (refErr) {
          console.error("[auth/callback] referral create failed", refErr);
        }
      }
    }
  } catch (e) {
    console.error("[auth/callback] failed to provision Prisma user/owner", {
      supabaseUserId: supabaseUser.id,
      email: supabaseUser.email,
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.redirect(
      new URL("/o/login?error=user_provisioning_failed", origin),
    );
  }

  return response;
}
