import { describe, expect, it, vi } from "vitest";

import { softDeleteAdminUserWithRelations } from "@/server/api/routers/admin-panel/users";

function makeTx(owner: { id: string } | null = { id: "owner_1" }) {
  const now = new Date("2026-06-12T09:00:00.000Z");
  const tx = {
    owner: {
      findUnique: vi.fn().mockResolvedValue(owner),
      updateMany: vi.fn().mockResolvedValue({ count: owner ? 1 : 0 }),
    },
    store: {
      updateMany: vi.fn().mockResolvedValue({ count: owner ? 2 : 0 }),
    },
    user: {
      update: vi.fn().mockResolvedValue({ id: "user_1", deletedAt: now }),
    },
  };

  return { tx, now };
}

describe("softDeleteAdminUserWithRelations", () => {
  it("管理画面でOWNERを論理削除すると紐づく店舗とownerも同じ時刻で非公開化する", async () => {
    const { tx, now } = makeTx({ id: "owner_1" });

    await expect(
      softDeleteAdminUserWithRelations(tx, { userId: "user_1", role: "OWNER" }, now),
    ).resolves.toEqual({ id: "user_1", deletedAt: now });

    expect(tx.owner.findUnique).toHaveBeenCalledWith({
      where: { userId: "user_1" },
      select: { id: true },
    });
    expect(tx.store.updateMany).toHaveBeenCalledWith({
      where: { ownerId: "owner_1", deletedAt: null },
      data: { deletedAt: now },
    });
    expect(tx.owner.updateMany).toHaveBeenCalledWith({
      where: { id: "owner_1", deletedAt: null },
      data: { deletedAt: now },
    });
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: { deletedAt: now },
      select: { id: true, deletedAt: true },
    });
  });

  it("CAST削除では店舗・ownerには触らずユーザーだけを論理削除する", async () => {
    const { tx, now } = makeTx({ id: "owner_1" });

    await softDeleteAdminUserWithRelations(tx, { userId: "cast_user_1", role: "CAST" }, now);

    expect(tx.owner.findUnique).not.toHaveBeenCalled();
    expect(tx.store.updateMany).not.toHaveBeenCalled();
    expect(tx.owner.updateMany).not.toHaveBeenCalled();
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: "cast_user_1" },
      data: { deletedAt: now },
      select: { id: true, deletedAt: true },
    });
  });
});
