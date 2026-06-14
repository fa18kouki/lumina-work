import { describe, expect, it, vi } from "vitest";
import {
  buildPublicStoreVisibilityWhere,
  getPublicStoresForListing,
} from "@/server/api/routers/store";

describe("公開店舗一覧の表示条件", () => {
  it("審査済み・未削除店舗かつ未退会オーナーの店舗だけを公開対象にする", () => {
    expect(buildPublicStoreVisibilityWhere()).toEqual({
      isVerified: true,
      deletedAt: null,
      owner: {
        is: {
          deletedAt: null,
          user: {
            is: {
              deletedAt: null,
            },
          },
        },
      },
    });
  });

  it("公開LPのためDB取得に失敗しても空配列へフォールバックする", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const prisma = {
      store: {
        findMany: async () => {
          throw new Error("database unavailable");
        },
      },
    };

    await expect(getPublicStoresForListing(prisma)).resolves.toEqual([]);
    errorSpy.mockRestore();
  });
});
