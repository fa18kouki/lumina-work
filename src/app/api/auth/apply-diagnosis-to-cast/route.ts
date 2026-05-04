import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Session } from "next-auth";
import type { Prisma } from "@prisma/client";
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
  // BUG-6 + C-2: photos は https:// 始まりの URL のみ許可する allowlist 方式。
  //   - blob: / Blob: / BLOB: などの大小文字バリアント (case-insensitive)
  //   - data: (DoS / 巨大ペイロード)
  //   - javascript: (XSS)
  //   - file:// (LFI)
  //   - http:// (mixed-content / 改ざんリスク)
  // をすべて拒否する。クライアント (DiagnosisSync) 側でも事前フィルタするが、
  // サーバ側でも防御層として allowlist で弾く。
  photos: z
    .array(
      z
        .string()
        .url()
        .refine((u) => /^https:\/\//i.test(u), {
          message: "https:// で始まる URL のみ許可されます",
        }),
    )
    .max(10)
    .optional(),
  // BUG-3: 強み (DiagnosisAnswers.strengths) は Cast スキーマに専用カラムが無いので、
  // Cast.description の末尾に "強み: A、B、C" を追記する形で永続化する。
  strengths: z.array(z.string()).max(20).optional(),
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

// BUG-3 + H-4: 既存 description との重複を避けつつ強みを追記する純粋関数。
// - 既に **行頭** で "強み:" を含む description の場合は idempotent に何もしない
//   (undefined を返す)
//   * 「私の強み: 笑顔」のような行頭以外のフレーズは検出しない
//     (永久 skip を避けるため)
// - description が空 (null/undefined/空文字) のときは "強み: A、B" を新規セット
// - 既存 description がある場合は "<existing>\n\n強み: A、B" を返す
function buildDescriptionWithStrengths(
  existing: string | null | undefined,
  strengths: readonly string[],
): string | undefined {
  if (strengths.length === 0) return undefined;
  const trimmed = (existing ?? "").trim();
  // 行頭マーカー判定: 文頭 or 改行直後の "強み:" のみ idempotent と扱う
  if (/(^|\n)強み:\s/m.test(trimmed)) return undefined;
  const strengthsLine = `強み: ${strengths.join("、")}`;
  if (trimmed.length === 0) return strengthsLine;
  return `${trimmed}\n\n${strengthsLine}`;
}

/**
 * 診断ページの localStorage に蓄積された回答 (DiagnosisAnswers) を、
 * ログイン後の Cast レコードに 1 度だけ反映する。
 *
 * - 認証必須 (NextAuth or Supabase)
 * - role は CAST 必須
 * - Cast row が無ければ 404 (sync-cast-user / NextAuth createUser で作られている前提)
 * - 既に diagnosisCompleted=true なら上書きせず skipped を返す
 *
 * クライアントは反映成功時に localStorage をクリアする。
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
    select: { id: true, diagnosisCompleted: true, description: true },
  });
  if (!cast) {
    return NextResponse.json({ error: "Cast not found" }, { status: 404 });
  }

  // 二重適用を防ぐ: 既に診断完了している Cast は触らない
  if (cast.diagnosisCompleted) {
    return NextResponse.json({ ok: true, skipped: true, reason: "already_completed" });
  }

  const a = parsed.data;
  // H-3: Prisma の生成型 (`Prisma.CastUpdateInput`) を使うことで、
  //   Cast スキーマ変更 (カラム rename / 型変更) をコンパイル時に検知できる。
  //   String[] カラムは Prisma 7 でも平配列代入 (= 完全置換) を受け付けるので、
  //   既存テストの互換性も保ちつつ型安全にする。
  const data: Prisma.CastUpdateInput = {
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

  if (a.strengths && a.strengths.length > 0) {
    const nextDescription = buildDescriptionWithStrengths(
      cast.description,
      a.strengths,
    );
    if (nextDescription !== undefined) {
      data.description = nextDescription;
    }
  }

  await prisma.cast.update({
    where: { id: cast.id },
    data,
  });

  return NextResponse.json({ ok: true });
}
