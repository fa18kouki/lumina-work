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

  await prisma.adminInvitation.update({
    where: { id: invitation.id },
    data: {
      status: "ACCEPTED",
      acceptedAt: new Date(),
      supabaseUserId,
    },
  });
}
