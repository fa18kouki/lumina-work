import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  provisionOwnerUser,
  type ProvisionMode,
  type ProvisionSupabaseUser,
} from "@/lib/provision-owner-user";

type PrismaMock = {
  user: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  owner: {
    create: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

function makePrisma(): PrismaMock {
  const mock: PrismaMock = {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    owner: {
      create: vi.fn(),
    },
    // $transaction(callback) は callback(tx) を実行し、tx は同じ prisma を返す
    $transaction: vi.fn(async (cb: (tx: unknown) => unknown) => cb(mock)),
  };
  return mock;
}

const SUPABASE_USER: ProvisionSupabaseUser = {
  id: "supabase-user-1",
  email: "owner@example.com",
  email_confirmed_at: "2026-04-01T00:00:00.000Z",
};

const MODES: ProvisionMode[] = ["register", "login", "invite"];

function asClient(p: PrismaMock): PrismaClient {
  return p as unknown as PrismaClient;
}

describe("provisionOwnerUser", () => {
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = makePrisma();
  });

  describe("supabaseAuthId ヒット系", () => {
    it.each(MODES)(
      "%s: 既存 OWNER (deletedAt=null) ならそのまま ok を返す",
      async (mode) => {
        prisma.user.findUnique.mockResolvedValue({
          id: "user-1",
          role: "OWNER",
          deletedAt: null,
          supabaseAuthId: SUPABASE_USER.id,
        });

        const result = await provisionOwnerUser(
          asClient(prisma),
          SUPABASE_USER,
          mode,
        );

        expect(result).toEqual({
          ok: true,
          userId: "user-1",
          newlyCreated: false,
        });
        expect(prisma.user.create).not.toHaveBeenCalled();
        expect(prisma.owner.create).not.toHaveBeenCalled();
      },
    );

    it.each(MODES)("%s: role≠OWNER は role_mismatch", async (mode) => {
      prisma.user.findUnique.mockResolvedValue({
        id: "user-cast",
        role: "CAST",
        deletedAt: null,
        supabaseAuthId: SUPABASE_USER.id,
      });

      const result = await provisionOwnerUser(
        asClient(prisma),
        SUPABASE_USER,
        mode,
      );

      expect(result).toEqual({ ok: false, reason: "role_mismatch" });
    });

    it.each(MODES)("%s: deletedAt あり は deleted", async (mode) => {
      prisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        role: "OWNER",
        deletedAt: new Date("2026-05-01"),
        supabaseAuthId: SUPABASE_USER.id,
      });

      const result = await provisionOwnerUser(
        asClient(prisma),
        SUPABASE_USER,
        mode,
      );

      expect(result).toEqual({ ok: false, reason: "deleted" });
    });
  });

  describe("supabaseAuthId 未ヒット + email 一致 (OWNER, deletedAt=null)", () => {
    it.each(MODES)(
      "%s: supabaseAuthId=null の既存 OWNER は紐付け update して ok",
      async (mode) => {
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.findFirst.mockResolvedValue({
          id: "user-1",
          supabaseAuthId: null,
        });
        prisma.user.update.mockResolvedValue({
          id: "user-1",
          supabaseAuthId: SUPABASE_USER.id,
        });

        const result = await provisionOwnerUser(
          asClient(prisma),
          SUPABASE_USER,
          mode,
        );

        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: "user-1" },
          data: expect.objectContaining({
            supabaseAuthId: SUPABASE_USER.id,
          }),
        });
        expect(result).toEqual({
          ok: true,
          userId: "user-1",
          newlyCreated: false,
        });
      },
    );

    it.each(MODES)(
      "%s: 別 supabaseAuthId に紐付き済の OWNER は email_collision",
      async (mode) => {
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.findFirst.mockResolvedValue({
          id: "user-1",
          supabaseAuthId: "other-supabase-id",
        });

        const result = await provisionOwnerUser(
          asClient(prisma),
          SUPABASE_USER,
          mode,
        );

        expect(result).toEqual({ ok: false, reason: "email_collision" });
        expect(prisma.user.update).not.toHaveBeenCalled();
      },
    );

    it.each(MODES)(
      "%s: 同じ supabaseAuthId が既に紐付いていれば update せず ok を返す",
      async (mode) => {
        prisma.user.findUnique.mockResolvedValue(null);
        // 競合: findUnique と findFirst の間に別経路で紐付け済になる稀ケース。
        // helper は idempotent に振る舞う。
        prisma.user.findFirst.mockResolvedValue({
          id: "user-1",
          supabaseAuthId: SUPABASE_USER.id,
        });

        const result = await provisionOwnerUser(
          asClient(prisma),
          SUPABASE_USER,
          mode,
        );

        expect(prisma.user.update).not.toHaveBeenCalled();
        expect(result).toEqual({
          ok: true,
          userId: "user-1",
          newlyCreated: false,
        });
      },
    );
  });

  describe("supabaseAuthId 未ヒット + email 未ヒット", () => {
    it("login: 新規作成せず not_found を返す", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.findFirst.mockResolvedValue(null);

      const result = await provisionOwnerUser(
        asClient(prisma),
        SUPABASE_USER,
        "login",
      );

      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(prisma.owner.create).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: false, reason: "not_found" });
    });

    it.each<ProvisionMode>(["register", "invite"])(
      "%s: User + Owner + FREE Subscription を $transaction で作成",
      async (mode) => {
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.findFirst.mockResolvedValue(null);
        prisma.user.create.mockResolvedValue({
          id: "new-user",
          email: SUPABASE_USER.email,
        });
        prisma.owner.create.mockResolvedValue({ id: "new-owner" });

        const result = await provisionOwnerUser(
          asClient(prisma),
          SUPABASE_USER,
          mode,
        );

        expect(prisma.$transaction).toHaveBeenCalledOnce();
        expect(prisma.user.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              email: SUPABASE_USER.email,
              role: "OWNER",
              supabaseAuthId: SUPABASE_USER.id,
            }),
          }),
        );
        expect(prisma.owner.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              userId: "new-user",
              subscription: {
                create: { plan: "FREE", status: "ACTIVE", offerLimit: 3 },
              },
            }),
          }),
        );
        expect(result).toEqual({
          ok: true,
          userId: "new-user",
          newlyCreated: true,
        });
      },
    );
  });

  describe("email が無いユーザー", () => {
    it("login: supabaseAuthId 未ヒット + email なし → not_found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await provisionOwnerUser(
        asClient(prisma),
        { ...SUPABASE_USER, email: null },
        "login",
      );

      expect(prisma.user.findFirst).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: false, reason: "not_found" });
    });

    it("register: email なしでも create を試みる (Supabase 側で確認済の前提)", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: "new-user",
        email: null,
      });
      prisma.owner.create.mockResolvedValue({ id: "new-owner" });

      const result = await provisionOwnerUser(
        asClient(prisma),
        { ...SUPABASE_USER, email: null },
        "register",
      );

      expect(prisma.user.findFirst).not.toHaveBeenCalled();
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result).toMatchObject({ ok: true, newlyCreated: true });
    });
  });
});
