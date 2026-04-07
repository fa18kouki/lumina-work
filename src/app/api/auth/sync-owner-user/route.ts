import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase-auth";
import { prisma } from "@/server/db";

/**
 * オーナーがメール/パスワードでログインしたあと、
 * Prisma User を role=OWNER で作成または既存をそのまま返す。
 * Cookie の Supabase セッションでユーザーを識別する。
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(cookieStore);
    const {
      data: { user: supabaseUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !supabaseUser) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Supabase session required" },
        { status: 401 }
      );
    }

    let prismaUser = await prisma.user.findUnique({
      where: { supabaseAuthId: supabaseUser.id },
    });

    if (!prismaUser && supabaseUser.email) {
      const existingByEmail = await prisma.user.findFirst({
        where: {
          email: supabaseUser.email,
          role: "OWNER",
        },
      });
      if (existingByEmail) {
        if (existingByEmail.supabaseAuthId == null) {
          prismaUser = await prisma.user.update({
            where: { id: existingByEmail.id },
            data: {
              supabaseAuthId: supabaseUser.id,
              emailVerified: supabaseUser.email_confirmed_at
                ? new Date(supabaseUser.email_confirmed_at)
                : undefined,
            },
          });
        } else if (existingByEmail.supabaseAuthId === supabaseUser.id) {
          prismaUser = existingByEmail;
        } else {
          return NextResponse.json(
            {
              error: "Conflict",
              message:
                "このメールアドレスは既に別のアカウントに紐付いています。",
            },
            { status: 409 }
          );
        }
      }
    }

    if (!prismaUser) {
      prismaUser = await prisma.user.create({
        data: {
          email: supabaseUser.email ?? undefined,
          emailVerified: supabaseUser.email_confirmed_at
            ? new Date(supabaseUser.email_confirmed_at)
            : null,
          role: "OWNER",
          supabaseAuthId: supabaseUser.id,
        },
      });

      // Owner レコードとデフォルト FREE サブスクリプションを同時作成
      await prisma.owner.create({
        data: {
          userId: prismaUser.id,
          subscription: {
            create: { plan: "FREE", status: "ACTIVE", offerLimit: 3 },
          },
        },
      });
    }

    return NextResponse.json({ ok: true, userId: prismaUser.id });
  } catch (e) {
    console.error("[sync-owner-user]", e);
    return NextResponse.json(
      { error: "Internal error", message: "Failed to sync user" },
      { status: 500 }
    );
  }
}
