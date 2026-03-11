import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase-auth";
import { prisma } from "@/server/db";

/**
 * キャストが Supabase マジックリンクでログインしたあと、
 * Prisma User を role=CAST で作成または既存をそのまま返す。
 * Cookie の Supabase セッションでユーザーを識別する。
 *
 * 整合性: 同じメールで既に CAST の User がいる場合（例: 先に LINE で登録済み）、
 * その User に supabaseAuthId を付与して紐付ける。同一人物が LINE とメールの両方で
 * ログインしても 1 つの User / Cast にまとまる。
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
          role: "CAST",
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
          role: "CAST",
          supabaseAuthId: supabaseUser.id,
        },
      });

      // メールで新規登録したキャスト用に、Prisma に最小限の Cast を作成（getProfile 等で null にならないようにする）
      await prisma.cast.create({
        data: {
          userId: prismaUser.id,
          nickname: "ゲスト",
          age: 18,
          photos: [],
          desiredAreas: [],
          preferredAtmosphere: [],
          preferredClientele: [],
          isAvailableNow: true,
        },
      });
    }

    return NextResponse.json({ ok: true, userId: prismaUser.id });
  } catch (e) {
    console.error("[sync-cast-user]", e);
    return NextResponse.json(
      { error: "Internal error", message: "Failed to sync user" },
      { status: 500 }
    );
  }
}
