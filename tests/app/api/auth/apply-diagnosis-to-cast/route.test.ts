import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const getCachedSupabaseUserMock = vi.fn();
const getCachedPrismaUserBySupabaseIdMock = vi.fn();
const castFindUniqueMock = vi.fn();
const castUpdateMock = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: authMock }));

vi.mock("@/lib/auth-cached", () => ({
  getCachedSupabaseUser: getCachedSupabaseUserMock,
  getCachedPrismaUserBySupabaseId: getCachedPrismaUserBySupabaseIdMock,
}));

vi.mock("@/server/db", () => ({
  prisma: {
    cast: {
      findUnique: castFindUniqueMock,
      update: castUpdateMock,
    },
  },
}));

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/auth/apply-diagnosis-to-cast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validAnswers = {
  age: 25,
  totalExperienceYears: 2,
  desiredAreas: ["新宿", "渋谷"],
  desiredHourlyRate: 4000,
  availableDaysPerWeek: 3,
  alcoholTolerance: "MODERATE" as const,
  preferredAtmosphere: ["落ち着いた店"],
  photos: ["https://example.com/photo1.jpg"],
};

describe("POST /api/auth/apply-diagnosis-to-cast", () => {
  beforeEach(() => {
    authMock.mockReset();
    getCachedSupabaseUserMock.mockReset();
    getCachedPrismaUserBySupabaseIdMock.mockReset();
    castFindUniqueMock.mockReset();
    castUpdateMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("未認証 (NextAuth/Supabase どちらも null) は 401", async () => {
    authMock.mockResolvedValue(null);
    getCachedSupabaseUserMock.mockResolvedValue(null);

    const { POST } = await import("@/app/api/auth/apply-diagnosis-to-cast/route");
    const res = await POST(makeRequest(validAnswers));

    expect(res.status).toBe(401);
  });

  it("CAST 以外の role は 403", async () => {
    authMock.mockResolvedValue({
      user: { id: "user-x", role: "OWNER" },
      expires: new Date(Date.now() + 60_000).toISOString(),
    });

    const { POST } = await import("@/app/api/auth/apply-diagnosis-to-cast/route");
    const res = await POST(makeRequest(validAnswers));

    expect(res.status).toBe(403);
  });

  it("Cast row 未作成のユーザーは 404", async () => {
    authMock.mockResolvedValue({
      user: { id: "cast-user", role: "CAST" },
      expires: new Date(Date.now() + 60_000).toISOString(),
    });
    castFindUniqueMock.mockResolvedValue(null);

    const { POST } = await import("@/app/api/auth/apply-diagnosis-to-cast/route");
    const res = await POST(makeRequest(validAnswers));

    expect(res.status).toBe(404);
    expect(castUpdateMock).not.toHaveBeenCalled();
  });

  it("既に diagnosisCompleted=true の Cast は更新せず skipped を返す", async () => {
    authMock.mockResolvedValue({
      user: { id: "cast-user", role: "CAST" },
      expires: new Date(Date.now() + 60_000).toISOString(),
    });
    castFindUniqueMock.mockResolvedValue({
      id: "cast-1",
      userId: "cast-user",
      diagnosisCompleted: true,
    });

    const { POST } = await import("@/app/api/auth/apply-diagnosis-to-cast/route");
    const res = await POST(makeRequest(validAnswers));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ ok: true, skipped: true });
    expect(castUpdateMock).not.toHaveBeenCalled();
  });

  it("正常系: NextAuth セッション + diagnosis 未完 Cast → answers が Cast に書き込まれ diagnosisCompleted=true", async () => {
    authMock.mockResolvedValue({
      user: { id: "cast-user", role: "CAST" },
      expires: new Date(Date.now() + 60_000).toISOString(),
    });
    castFindUniqueMock.mockResolvedValue({
      id: "cast-1",
      userId: "cast-user",
      diagnosisCompleted: false,
    });
    castUpdateMock.mockResolvedValue({});

    const { POST } = await import("@/app/api/auth/apply-diagnosis-to-cast/route");
    const res = await POST(makeRequest(validAnswers));

    expect(res.status).toBe(200);
    expect(castUpdateMock).toHaveBeenCalledTimes(1);
    const args = castUpdateMock.mock.calls[0][0] as {
      where: { id: string };
      data: Record<string, unknown>;
    };
    expect(args.where.id).toBe("cast-1");
    expect(args.data.age).toBe(25);
    expect(args.data.desiredAreas).toEqual(["新宿", "渋谷"]);
    expect(args.data.desiredHourlyRate).toBe(4000);
    expect(args.data.alcoholTolerance).toBe("MODERATE");
    expect(args.data.diagnosisCompleted).toBe(true);
    expect(args.data.diagnosisCompletedAt).toBeInstanceOf(Date);
  });

  it("Supabase Auth フォールバック: NextAuth は null だが Supabase ユーザー存在 → 認証通る", async () => {
    authMock.mockResolvedValue(null);
    getCachedSupabaseUserMock.mockResolvedValue({ id: "sb-user-1" });
    getCachedPrismaUserBySupabaseIdMock.mockResolvedValue({
      id: "cast-user-2",
      email: null,
      image: null,
      role: "CAST",
    });
    castFindUniqueMock.mockResolvedValue({
      id: "cast-2",
      userId: "cast-user-2",
      diagnosisCompleted: false,
    });
    castUpdateMock.mockResolvedValue({});

    const { POST } = await import("@/app/api/auth/apply-diagnosis-to-cast/route");
    const res = await POST(makeRequest(validAnswers));

    expect(res.status).toBe(200);
    expect(castUpdateMock).toHaveBeenCalledTimes(1);
  });

  it("不正な input (age=200) は 400", async () => {
    authMock.mockResolvedValue({
      user: { id: "cast-user", role: "CAST" },
      expires: new Date(Date.now() + 60_000).toISOString(),
    });

    const { POST } = await import("@/app/api/auth/apply-diagnosis-to-cast/route");
    const res = await POST(makeRequest({ age: 200 }));

    expect(res.status).toBe(400);
    expect(castUpdateMock).not.toHaveBeenCalled();
  });
});
