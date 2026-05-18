import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionCookie,
  verifyAdminApiKey,
} from "@/lib/admin-auth";

// node:crypto を使うため Node.js runtime を明示。
// Vercel Fluid Compute 配下で middleware と route handler が同じ runtime で動く想定。
export const runtime = "nodejs";

const bodySchema = z.object({
  apiKey: z.string().min(1).max(512),
});

function buildSessionCookie(value: string, maxAge: number) {
  return {
    name: ADMIN_SESSION_COOKIE,
    value,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function POST(req: NextRequest) {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_API_KEY is not configured" },
      { status: 503 },
    );
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    const body: unknown = await req.json();
    parsed = bodySchema.parse(body);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (!verifyAdminApiKey(parsed.apiKey, expected)) {
    // ブルートフォースを若干鈍化させる。常に同じ遅延 (タイミングサイドチャネル化しない)
    await new Promise((r) => setTimeout(r, 300));
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cookieValue = createAdminSessionCookie(expected);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(buildSessionCookie(cookieValue, ADMIN_SESSION_MAX_AGE_SECONDS));
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(buildSessionCookie("", 0));
  return res;
}
