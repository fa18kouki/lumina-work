import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  createNonAdminCaller,
  createTestCastUser,
  createTestStoreUser,
  cleanupTestData,
  prisma,
} from "./admin/__helpers__/setup";

describe("message router", () => {
  let castUserId: string;
  let storeUserId: string;
  let matchId: string;

  beforeAll(async () => {
    await cleanupTestData();

    const castUser = await createTestCastUser(
      { id: "msg-cast-user", email: "msg-cast@test.com" },
      { nickname: "テストキャスト" }
    );
    castUserId = castUser.id;

    const storeUser = await createTestStoreUser(
      { id: "msg-store-user", email: "msg-store@test.com" },
      { name: "テスト店舗" }
    );
    storeUserId = storeUser.id;

    const match = await prisma.match.create({
      data: {
        castId: castUser.cast.id,
        storeId: storeUser.store.id,
        status: "ACCEPTED",
      },
    });
    matchId = match.id;
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe("send", () => {
    it("テキストのみ送信できる", async () => {
      const caller = createNonAdminCaller(castUserId);
      const result = await caller.message.send({
        matchId,
        content: "テストメッセージ",
      });

      expect(result.content).toBe("テストメッセージ");
      expect(result.matchId).toBe(matchId);
      expect(result.images).toHaveLength(0);
    });

    it("画像のみ送信できる", async () => {
      const caller = createNonAdminCaller(castUserId);
      const result = await caller.message.send({
        matchId,
        imageUrls: [
          "https://example.com/image1.jpg",
          "https://example.com/image2.jpg",
        ],
      });

      expect(result.content).toBeNull();
      expect(result.images).toHaveLength(2);
      expect(result.images[0].url).toBe("https://example.com/image1.jpg");
      expect(result.images[0].order).toBe(0);
      expect(result.images[1].url).toBe("https://example.com/image2.jpg");
      expect(result.images[1].order).toBe(1);
    });

    it("テキスト+画像を送信できる", async () => {
      const caller = createNonAdminCaller(castUserId);
      const result = await caller.message.send({
        matchId,
        content: "写真付きメッセージ",
        imageUrls: ["https://example.com/photo.png"],
      });

      expect(result.content).toBe("写真付きメッセージ");
      expect(result.images).toHaveLength(1);
      expect(result.images[0].url).toBe("https://example.com/photo.png");
    });

    it("contentもimageUrlsも空の場合はバリデーションエラー", async () => {
      const caller = createNonAdminCaller(castUserId);

      await expect(
        caller.message.send({ matchId })
      ).rejects.toThrow();
    });

    it("空文字のcontentかつimageUrlsなしはバリデーションエラー", async () => {
      const caller = createNonAdminCaller(castUserId);

      await expect(
        caller.message.send({ matchId, content: "   " })
      ).rejects.toThrow();
    });

    it("6枚以上の画像はバリデーションエラー", async () => {
      const caller = createNonAdminCaller(castUserId);

      await expect(
        caller.message.send({
          matchId,
          imageUrls: [
            "https://example.com/1.jpg",
            "https://example.com/2.jpg",
            "https://example.com/3.jpg",
            "https://example.com/4.jpg",
            "https://example.com/5.jpg",
            "https://example.com/6.jpg",
          ],
        })
      ).rejects.toThrow();
    });
  });

  describe("getMessages", () => {
    it("画像付きメッセージが取得できる", async () => {
      // 画像付きメッセージを先に送信
      const caller = createNonAdminCaller(castUserId);
      await caller.message.send({
        matchId,
        content: "画像テスト",
        imageUrls: ["https://example.com/test.webp"],
      });

      const result = await caller.message.getMessages({
        matchId,
        limit: 50,
      });

      const imageMessage = result.messages.find(
        (m) => m.content === "画像テスト"
      );
      expect(imageMessage).toBeDefined();
      expect(imageMessage!.images).toHaveLength(1);
      expect(imageMessage!.images[0].url).toBe("https://example.com/test.webp");
    });

    it("画像はorder順で取得される", async () => {
      const caller = createNonAdminCaller(castUserId);
      await caller.message.send({
        matchId,
        imageUrls: [
          "https://example.com/a.jpg",
          "https://example.com/b.jpg",
          "https://example.com/c.jpg",
        ],
      });

      const result = await caller.message.getMessages({
        matchId,
        limit: 50,
      });

      const lastMsg = result.messages[result.messages.length - 1];
      expect(lastMsg.images).toHaveLength(3);
      expect(lastMsg.images[0].order).toBe(0);
      expect(lastMsg.images[1].order).toBe(1);
      expect(lastMsg.images[2].order).toBe(2);
    });
  });
});
