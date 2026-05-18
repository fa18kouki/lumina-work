import { beforeEach, describe, expect, it, vi } from "vitest";

import { markAdminInvitationAccepted } from "@/lib/admin-invitation-acceptance";

function makePrisma() {
  const findUnique = vi.fn();
  const update = vi.fn();
  return {
    mock: {
      adminInvitation: {
        findUnique: (...args: unknown[]) => findUnique(...args),
        update: (...args: unknown[]) => update(...args),
      },
    },
    findUnique,
    update,
  };
}

describe("markAdminInvitationAccepted", () => {
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    prisma = makePrisma();
  });

  it("email が null なら何もしない (Supabase user に email が無いケース)", async () => {
    await markAdminInvitationAccepted(
      // @ts-expect-error テスト用最小モック
      prisma.mock,
      null,
      "sb-1",
    );
    expect(prisma.findUnique).not.toHaveBeenCalled();
    expect(prisma.update).not.toHaveBeenCalled();
  });

  it("該当する AdminInvitation が無ければ何もしない", async () => {
    prisma.findUnique.mockResolvedValue(null);
    await markAdminInvitationAccepted(
      // @ts-expect-error テスト用最小モック
      prisma.mock,
      "no-invite@example.com",
      "sb-1",
    );
    expect(prisma.update).not.toHaveBeenCalled();
  });

  it("既に ACCEPTED の招待には触らない (冪等)", async () => {
    prisma.findUnique.mockResolvedValue({
      id: "inv-1",
      email: "x@example.com",
      status: "ACCEPTED",
    });
    await markAdminInvitationAccepted(
      // @ts-expect-error テスト用最小モック
      prisma.mock,
      "x@example.com",
      "sb-1",
    );
    expect(prisma.update).not.toHaveBeenCalled();
  });

  it("PENDING の招待は ACCEPTED に更新し supabaseUserId を埋める", async () => {
    prisma.findUnique.mockResolvedValue({
      id: "inv-1",
      email: "x@example.com",
      status: "PENDING",
      supabaseUserId: null,
    });
    prisma.update.mockResolvedValue({});
    await markAdminInvitationAccepted(
      // @ts-expect-error テスト用最小モック
      prisma.mock,
      "x@example.com",
      "sb-uuid-new",
    );
    expect(prisma.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "inv-1" },
        data: expect.objectContaining({
          status: "ACCEPTED",
          supabaseUserId: "sb-uuid-new",
          acceptedAt: expect.any(Date),
        }),
      }),
    );
  });

  it("REVOKED の招待にも触らない (取消し済みは復活させない)", async () => {
    prisma.findUnique.mockResolvedValue({
      id: "inv-1",
      email: "x@example.com",
      status: "REVOKED",
    });
    await markAdminInvitationAccepted(
      // @ts-expect-error テスト用最小モック
      prisma.mock,
      "x@example.com",
      "sb-1",
    );
    expect(prisma.update).not.toHaveBeenCalled();
  });
});
