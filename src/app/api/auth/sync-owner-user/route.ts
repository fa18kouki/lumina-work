import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase-auth";
import { prisma } from "@/server/db";
import { markAdminInvitationAccepted } from "@/lib/admin-invitation-acceptance";
import {
  provisionOwnerUser,
  type ProvisionMode,
} from "@/lib/provision-owner-user";

const VALID_MODES: ReadonlySet<ProvisionMode> = new Set([
  "register",
  "login",
  "invite",
]);

/**
 * オーナーの Supabase セッションを元に Prisma User (role=OWNER) を解決する。
 *
 * 呼び出し側 (mode):
 *   - "register": /o/register からの新規 sign-up → 未存在なら create
 *   - "login":    /o/login のパスワード認証 → 未存在なら 404 で弾く (auto-create しない)
 *   - "invite":   /o/login の implicit hash flow (招待リンク経由) → 未存在なら create
 *
 * mode 未指定 (=旧 client) は安全側に倒して "login" 扱い。
 */
export async function POST(request: Request) {
  try {
    const mode = await readMode(request);

    const cookieStore = await cookies();
    const supabase = createServerClient(cookieStore);
    const {
      data: { user: supabaseUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !supabaseUser) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Supabase session required" },
        { status: 401 },
      );
    }

    const result = await provisionOwnerUser(
      prisma,
      {
        id: supabaseUser.id,
        email: supabaseUser.email ?? null,
        email_confirmed_at: supabaseUser.email_confirmed_at ?? null,
      },
      mode,
    );

    if (!result.ok) {
      switch (result.reason) {
        case "not_found":
          return NextResponse.json(
            {
              error: "NotFound",
              message:
                "このメールアドレスは登録されていません。新規登録から始めてください。",
            },
            { status: 404 },
          );
        case "role_mismatch":
          return NextResponse.json(
            {
              error: "Conflict",
              message: "このアカウントはオーナーとして使用できません。",
            },
            { status: 409 },
          );
        case "email_collision":
          return NextResponse.json(
            {
              error: "Conflict",
              message:
                "このメールアドレスは既に別のアカウントに紐付いています。",
            },
            { status: 409 },
          );
        case "deleted":
          return NextResponse.json(
            {
              error: "Gone",
              message: "このアカウントは退会済みです。",
            },
            { status: 410 },
          );
      }
    }

    // 管理画面からの招待で来た場合、AdminInvitation を ACCEPTED にマーク (best-effort)。
    // implicit flow (招待メール直リンク) でも受諾マークが付くようにする。
    // 失敗してもログイン自体は妨げない。
    try {
      await markAdminInvitationAccepted(
        prisma,
        supabaseUser.email,
        supabaseUser.id,
      );
    } catch (e) {
      console.warn("[sync-owner-user] markAdminInvitationAccepted failed", {
        email: supabaseUser.email,
        error: e instanceof Error ? e.message : String(e),
      });
    }

    return NextResponse.json({ ok: true, userId: result.userId });
  } catch (e) {
    console.error("[sync-owner-user]", e);
    return NextResponse.json(
      { error: "Internal error", message: "Failed to sync user" },
      { status: 500 },
    );
  }
}

async function readMode(request: Request): Promise<ProvisionMode> {
  try {
    const body = (await request.json().catch(() => null)) as
      | { mode?: unknown }
      | null;
    const raw = body?.mode;
    if (typeof raw === "string" && VALID_MODES.has(raw as ProvisionMode)) {
      return raw as ProvisionMode;
    }
  } catch {
    // ignore — fall through to default
  }
  return "login";
}
