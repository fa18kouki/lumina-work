import type { PrismaClient } from "@prisma/client";

export type ProvisionMode = "register" | "login" | "invite";

export type ProvisionSupabaseUser = {
  id: string;
  email: string | null;
  email_confirmed_at: string | null;
};

export type ProvisionResult =
  | { ok: true; userId: string; newlyCreated: boolean }
  | {
      ok: false;
      reason: "not_found" | "role_mismatch" | "email_collision" | "deleted";
    };

/**
 * Supabase Auth セッションに対して Prisma 側の OWNER User + Owner レコードを冪等に解決する。
 *
 * mode の意味:
 *  - "register": /o/register からの新規登録 → 未存在なら create
 *  - "login":    /o/login でパスワード認証成功 → 未存在なら not_found を返す (auto-create しない)
 *  - "invite":   /api/auth/callback (PKCE) や /o/login の implicit hash flow からの招待リンク経由
 *                 未存在なら create (admin が招待を許可した意図の表明)
 *
 * 旧コード (sync-owner-user / callback) では「未存在は常に create」だったため、
 * 招待されていない supabase auth user が password ログインだけで OWNER に昇格できる
 * セキュリティ穴があった。本 helper は mode で意図を明示することでそれを塞ぐ。
 */
export async function provisionOwnerUser(
  prisma: PrismaClient,
  supabaseUser: ProvisionSupabaseUser,
  mode: ProvisionMode,
): Promise<ProvisionResult> {
  // 1) supabaseAuthId で既存 user を探す。
  const existingBySupabase = await prisma.user.findUnique({
    where: { supabaseAuthId: supabaseUser.id },
    select: {
      id: true,
      role: true,
      deletedAt: true,
      supabaseAuthId: true,
    },
  });

  if (existingBySupabase) {
    if (existingBySupabase.role !== "OWNER") {
      return { ok: false, reason: "role_mismatch" };
    }
    if (existingBySupabase.deletedAt) {
      return { ok: false, reason: "deleted" };
    }
    return { ok: true, userId: existingBySupabase.id, newlyCreated: false };
  }

  // 2) email で OWNER (active) を探す。
  //    auth.users 削除 → 再登録で supabaseAuthId が変わったケースを救う。
  const existingByEmail = supabaseUser.email
    ? await prisma.user.findFirst({
        where: {
          email: supabaseUser.email,
          role: "OWNER",
          deletedAt: null,
        },
        select: { id: true, supabaseAuthId: true },
      })
    : null;

  if (existingByEmail) {
    if (existingByEmail.supabaseAuthId == null) {
      await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          supabaseAuthId: supabaseUser.id,
          emailVerified: supabaseUser.email_confirmed_at
            ? new Date(supabaseUser.email_confirmed_at)
            : undefined,
        },
      });
      return { ok: true, userId: existingByEmail.id, newlyCreated: false };
    }

    if (existingByEmail.supabaseAuthId === supabaseUser.id) {
      // 並列リクエストなどで既に紐付き済 → idempotent に ok。
      return { ok: true, userId: existingByEmail.id, newlyCreated: false };
    }

    // 別 supabaseAuthId に紐付いていれば衝突。
    return { ok: false, reason: "email_collision" };
  }

  // 3) どちらも未ヒット。login mode は auto-create しない。
  if (mode === "login") {
    return { ok: false, reason: "not_found" };
  }

  // 4) register / invite は新規作成。User + Owner + FREE Subscription を atomic に。
  const created = await prisma.$transaction(async (tx) => {
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

    await tx.owner.create({
      data: {
        userId: createdUser.id,
        subscription: {
          create: { plan: "FREE", status: "ACTIVE", offerLimit: 3 },
        },
      },
    });

    return createdUser;
  });

  return { ok: true, userId: created.id, newlyCreated: true };
}
