import { describe, it, expect, vi, beforeEach } from "vitest";

// next/headers をモック
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    set: vi.fn(),
  })),
}));

// Supabase を制御可能にモック
const mockGetUser = vi.fn();
vi.mock("@/lib/supabase-auth", () => ({
  createServerClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

// helper を mock 化して route の責務 (mode 受け取り / HTTP マッピング) だけ検証する
const mockProvision = vi.fn();
vi.mock("@/lib/provision-owner-user", () => ({
  provisionOwnerUser: (...args: unknown[]) => mockProvision(...args),
}));

// markAdminInvitationAccepted の副作用は best-effort なのでスタブだけ用意
const mockMarkAccepted = vi.fn();
vi.mock("@/lib/admin-invitation-acceptance", () => ({
  markAdminInvitationAccepted: (...args: unknown[]) => mockMarkAccepted(...args),
}));

vi.mock("@/server/db", () => ({
  prisma: { __sentinel: "prisma" },
}));

import { POST } from "@/app/api/auth/sync-owner-user/route";

function makeRequest(body?: unknown): Request {
  return new Request("http://localhost/api/auth/sync-owner-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? null : JSON.stringify(body),
  });
}

const SUPABASE_USER = {
  id: "supabase-user-1",
  email: "owner@example.com",
  email_confirmed_at: new Date("2026-04-01").toISOString(),
};

describe("POST /api/auth/sync-owner-user", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: SUPABASE_USER },
      error: null,
    });
    mockMarkAccepted.mockResolvedValue(undefined);
  });

  it("Supabase セッションが無いときは 401", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await POST(makeRequest({ mode: "login" }));

    expect(res.status).toBe(401);
    expect(mockProvision).not.toHaveBeenCalled();
  });

  it("body 無し POST は mode=login で扱い、未登録なら 404 を返す", async () => {
    mockProvision.mockResolvedValue({ ok: false, reason: "not_found" });

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("NotFound");
    // helper には login が渡っている
    const calledWithMode = mockProvision.mock.calls[0][2];
    expect(calledWithMode).toBe("login");
  });

  it("mode=login + 既存ユーザー → 200 を返す", async () => {
    mockProvision.mockResolvedValue({
      ok: true,
      userId: "user-1",
      newlyCreated: false,
    });

    const res = await POST(makeRequest({ mode: "login" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true, userId: "user-1" });
  });

  it("mode=register + 新規作成 → 200 を返し、helper に register が渡る", async () => {
    mockProvision.mockResolvedValue({
      ok: true,
      userId: "new-user",
      newlyCreated: true,
    });

    const res = await POST(makeRequest({ mode: "register" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.userId).toBe("new-user");
    expect(mockProvision.mock.calls[0][2]).toBe("register");
  });

  it("mode=invite + 新規作成 → 200 を返し、helper に invite が渡る", async () => {
    mockProvision.mockResolvedValue({
      ok: true,
      userId: "invited-user",
      newlyCreated: true,
    });

    const res = await POST(makeRequest({ mode: "invite" }));

    expect(res.status).toBe(200);
    expect(mockProvision.mock.calls[0][2]).toBe("invite");
  });

  it("role_mismatch は 409 Conflict", async () => {
    mockProvision.mockResolvedValue({ ok: false, reason: "role_mismatch" });

    const res = await POST(makeRequest({ mode: "login" }));

    expect(res.status).toBe(409);
  });

  it("email_collision は 409 Conflict", async () => {
    mockProvision.mockResolvedValue({ ok: false, reason: "email_collision" });

    const res = await POST(makeRequest({ mode: "register" }));

    expect(res.status).toBe(409);
  });

  it("deleted は 410 Gone", async () => {
    mockProvision.mockResolvedValue({ ok: false, reason: "deleted" });

    const res = await POST(makeRequest({ mode: "login" }));

    expect(res.status).toBe(410);
  });

  it("不正な mode は login にフォールバックする", async () => {
    mockProvision.mockResolvedValue({
      ok: true,
      userId: "user-1",
      newlyCreated: false,
    });

    await POST(makeRequest({ mode: "evil-mode" }));

    expect(mockProvision.mock.calls[0][2]).toBe("login");
  });

  it("成功時のみ markAdminInvitationAccepted を呼ぶ", async () => {
    mockProvision.mockResolvedValue({
      ok: true,
      userId: "user-1",
      newlyCreated: false,
    });

    await POST(makeRequest({ mode: "login" }));

    expect(mockMarkAccepted).toHaveBeenCalledTimes(1);
  });

  it("失敗時は markAdminInvitationAccepted を呼ばない", async () => {
    mockProvision.mockResolvedValue({ ok: false, reason: "not_found" });

    await POST(makeRequest({ mode: "login" }));

    expect(mockMarkAccepted).not.toHaveBeenCalled();
  });

  it("markAdminInvitationAccepted の失敗は本体応答に影響しない", async () => {
    mockProvision.mockResolvedValue({
      ok: true,
      userId: "user-1",
      newlyCreated: false,
    });
    mockMarkAccepted.mockRejectedValueOnce(new Error("boom"));

    const res = await POST(makeRequest({ mode: "login" }));

    expect(res.status).toBe(200);
  });
});
