import type { PrismaClient } from "@prisma/client";

/**
 * Supabase 招待リンク経由でログインしたユーザーについて、
 * 対応する AdminInvitation 行があれば ACCEPTED にマークする。
 *
 * 設計上のポイント:
 *   - 招待の有無に関係なく呼ばれる (普通の /o/register からのコールバックも通る)
 *   - 該当行が無い・既に ACCEPTED・REVOKED ならすべて no-op (冪等)
 *   - 例外で auth フロー全体を壊さないよう、呼び出し側で try/catch する想定
 */
export async function markAdminInvitationAccepted(
  prisma: PrismaClient,
  email: string | null | undefined,
  supabaseUserId: string,
): Promise<void> {
  if (!email) return;

  const invitation = await prisma.adminInvitation.findUnique({
    where: { email },
  });
  if (!invitation) return;
  if (invitation.status !== "PENDING") return;

  // TOCTOU 対策: findUnique と update の間に他プロセスが status を
  // REVOKED に変えていた場合は、updateMany の where 句で弾く。
  // result.count === 0 なら既に他で書き換わったので no-op で安全に終わる。
  await prisma.adminInvitation.updateMany({
    where: { id: invitation.id, status: "PENDING" },
    data: {
      status: "ACCEPTED",
      acceptedAt: new Date(),
      supabaseUserId,
    },
  });
}
