import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import {
  getCachedPrismaUserBySupabaseId,
  getCachedSupabaseUser,
} from "@/lib/auth-cached";
import { prisma } from "@/server/db";

const inputSchema = z.object({
  age: z.number().int().min(18).max(99).optional(),
  totalExperienceYears: z.number().min(0).max(50).optional(),
  desiredAreas: z.array(z.string()).max(20).optional(),
  desiredHourlyRate: z.number().min(0).max(1_000_000).optional(),
  availableDaysPerWeek: z.number().min(1).max(7).optional(),
  alcoholTolerance: z
    .enum(["NONE", "WEAK", "MODERATE", "STRONG", "NG"])
    .optional(),
  preferredAtmosphere: z.array(z.string()).max(20).optional(),
  photos: z.array(z.string().url()).max(10).optional(),
});

type CallerIdentity = { userId: string; role: string | null };

async function resolveCaller(): Promise<CallerIdentity | null> {
  // NextAuth (LINE 等) を優先
  const nextAuthSession = (await auth()) as Session | null;
  const nextAuthUser = nextAuthSession?.user;
  if (nextAuthUser?.id) {
    return {
      userId: nextAuthUser.id,
      role: (nextAuthUser as { role?: string | null }).role ?? null,
    };
  }

  // Supabase マジックリンク経路
  const supabaseUser = await getCachedSupabaseUser();
  if (!supabaseUser) return null;
  const prismaUser = await getCachedPrismaUserBySupabaseId(supabaseUser.id);
  if (!prismaUser) return null;
  return { userId: prismaUser.id, role: prismaUser.role ?? null };
}

/**
 * 診断ページの sessionStorage に蓄積された回答 (DiagnosisAnswers) を、
 * ログイン後の Cast レコードに 1 度だけ反映する。
 *
 * - 認証必須 (NextAuth or Supabase)
 * - role は CAST 必須
 * - Cast row が無ければ 404 (sync-cast-user / NextAuth createUser で作られている前提)
 * - 既に diagnosisCompleted=true なら上書きせず skipped を返す
 *
 * クライアントは反映成功時に sessionStorage をクリアする。
 */
export async function POST(req: NextRequest) {
  const caller = await resolveCaller();
  if (!caller) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (caller.role !== "CAST") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.format() },
      { status: 400 },
    );
  }

  const cast = await prisma.cast.findUnique({
    where: { userId: caller.userId },
    select: { id: true, diagnosisCompleted: true },
  });
  if (!cast) {
    return NextResponse.json({ error: "Cast not found" }, { status: 404 });
  }

  // 二重適用を防ぐ: 既に診断完了している Cast は触らない
  if (cast.diagnosisCompleted) {
    return NextResponse.json({ ok: true, skipped: true, reason: "already_completed" });
  }

  const a = parsed.data;
  const data: Record<string, unknown> = {
    diagnosisCompleted: true,
    diagnosisCompletedAt: new Date(),
  };
  if (a.age !== undefined) data.age = a.age;
  if (a.totalExperienceYears !== undefined)
    data.totalExperienceYears = a.totalExperienceYears;
  if (a.desiredAreas) data.desiredAreas = a.desiredAreas;
  if (a.desiredHourlyRate !== undefined)
    data.desiredHourlyRate = a.desiredHourlyRate;
  if (a.availableDaysPerWeek !== undefined)
    data.availableDaysPerWeek = a.availableDaysPerWeek;
  if (a.alcoholTolerance) data.alcoholTolerance = a.alcoholTolerance;
  if (a.preferredAtmosphere) data.preferredAtmosphere = a.preferredAtmosphere;
  if (a.photos && a.photos.length > 0) data.photos = a.photos;

  await prisma.cast.update({
    where: { id: cast.id },
    data,
  });

  return NextResponse.json({ ok: true });
}
