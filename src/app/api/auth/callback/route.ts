import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/server/db";
import { REFERRAL_CONFIG } from "@/lib/constants";
import { resolveNextUrl } from "@/app/api/auth/callback/resolve-next-url";
import { markAdminInvitationAccepted } from "@/lib/admin-invitation-acceptance";
import { provisionOwnerUser } from "@/lib/provision-owner-user";

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

  // 2) Prisma User を冪等に provision。
  //    招待リンク経由なので mode=invite (未存在なら User+Owner+Subscription を新規作成)。
  //    helper が role/deletedAt/email_collision を判定し、結果を HTTP リダイレクトに割り付ける。
  let newOwnerId: string | null = null;
  try {
    const result = await provisionOwnerUser(
      prisma,
      {
        id: supabaseUser.id,
        email: supabaseUser.email ?? null,
        email_confirmed_at: supabaseUser.email_confirmed_at ?? null,
      },
      "invite",
    );

    if (!result.ok) {
      switch (result.reason) {
        case "email_collision":
          console.error(
            "[auth/callback] OWNER email collision with different supabaseAuthId",
            { email: supabaseUser.email },
          );
          return NextResponse.redirect(
            new URL("/o/login?error=email_collision", origin),
          );
        case "role_mismatch":
          return NextResponse.redirect(
            new URL("/o/login?error=not_owner", origin),
          );
        case "deleted":
          return NextResponse.redirect(
            new URL("/o/login?error=account_deleted", origin),
          );
        case "not_found":
          // invite mode は未存在を create に倒すため、ここには来ない想定。
          // 万一来たら user_provisioning_failed として扱う。
          return NextResponse.redirect(
            new URL("/o/login?error=user_provisioning_failed", origin),
          );
      }
    }

    if (result.newlyCreated) {
      const ownerRecord = await prisma.owner.findUnique({
        where: { userId: result.userId },
        select: { id: true },
      });
      newOwnerId = ownerRecord?.id ?? null;
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

  // リファーラルコードの処理 (新規作成時のみ、失敗しても本体ログインは妨げない)
  if (newOwnerId && refCode) {
    try {
      const referrer = await prisma.owner.findUnique({
        where: { referralCode: refCode.toUpperCase() },
        select: { id: true },
      });

      if (referrer && referrer.id !== newOwnerId) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFERRAL_CONFIG.expirationDays);

        await prisma.referral.create({
          data: {
            referrerOwnerId: referrer.id,
            referredOwnerId: newOwnerId,
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

  // 管理画面からの招待で来た場合、AdminInvitation を ACCEPTED にマーク (best-effort)。
  // 失敗してもログイン自体は妨げない。
  try {
    await markAdminInvitationAccepted(
      prisma,
      supabaseUser.email,
      supabaseUser.id,
    );
  } catch (e) {
    console.warn("[auth/callback] markAdminInvitationAccepted failed", {
      email: supabaseUser.email,
      error: e instanceof Error ? e.message : String(e),
    });
  }

  return response;
}
