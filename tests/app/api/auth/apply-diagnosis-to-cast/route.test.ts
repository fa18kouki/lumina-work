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

  // BUG-3: strengths を Cast.description に追記する (Prisma スキーマ変更不要)
  describe("BUG-3: strengths の Cast.description 追記", () => {
    beforeEach(() => {
      authMock.mockResolvedValue({
        user: { id: "cast-user", role: "CAST" },
        expires: new Date(Date.now() + 60_000).toISOString(),
      });
      castUpdateMock.mockResolvedValue({});
    });

    it("既存 description が空の Cast に strengths を渡すと '強み: ...' が description に書き込まれる", async () => {
      castFindUniqueMock.mockResolvedValue({
        id: "cast-3",
        userId: "cast-user",
        diagnosisCompleted: false,
        description: null,
      });

      const { POST } = await import(
        "@/app/api/auth/apply-diagnosis-to-cast/route"
      );
      const res = await POST(
        makeRequest({
          ...validAnswers,
          strengths: ["コミュニケーション力", "容姿"],
        }),
      );

      expect(res.status).toBe(200);
      const args = castUpdateMock.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(args.data.description).toBe(
        "強み: コミュニケーション力、容姿",
      );
    });

    it("既存 description がある Cast に strengths を追加すると '\\n\\n強み: ...' で末尾に追記される", async () => {
      castFindUniqueMock.mockResolvedValue({
        id: "cast-4",
        userId: "cast-user",
        diagnosisCompleted: false,
        description: "既存の自己紹介",
      });

      const { POST } = await import(
        "@/app/api/auth/apply-diagnosis-to-cast/route"
      );
      const res = await POST(
        makeRequest({
          ...validAnswers,
          strengths: ["コミュニケーション力", "容姿"],
        }),
      );

      expect(res.status).toBe(200);
      const args = castUpdateMock.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(args.data.description).toBe(
        "既存の自己紹介\n\n強み: コミュニケーション力、容姿",
      );
    });

    it("既存 description に既に '強み:' が含まれる場合は追記しない (idempotent)", async () => {
      castFindUniqueMock.mockResolvedValue({
        id: "cast-5",
        userId: "cast-user",
        diagnosisCompleted: false,
        description: "既存の自己紹介\n\n強み: 古い強み",
      });

      const { POST } = await import(
        "@/app/api/auth/apply-diagnosis-to-cast/route"
      );
      const res = await POST(
        makeRequest({
          ...validAnswers,
          strengths: ["コミュニケーション力", "容姿"],
        }),
      );

      expect(res.status).toBe(200);
      const args = castUpdateMock.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(args.data.description).toBeUndefined();
    });

    it("strengths が空配列の場合は description を更新しない", async () => {
      castFindUniqueMock.mockResolvedValue({
        id: "cast-6",
        userId: "cast-user",
        diagnosisCompleted: false,
        description: null,
      });

      const { POST } = await import(
        "@/app/api/auth/apply-diagnosis-to-cast/route"
      );
      const res = await POST(
        makeRequest({
          ...validAnswers,
          strengths: [],
        }),
      );

      expect(res.status).toBe(200);
      const args = castUpdateMock.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(args.data.description).toBeUndefined();
    });
  });

  // BUG-6 (部分): blob: URL を photos に保存しない
  describe("BUG-6: blob: URL の拒否", () => {
    it("photos に blob: URL が含まれていると 400", async () => {
      authMock.mockResolvedValue({
        user: { id: "cast-user", role: "CAST" },
        expires: new Date(Date.now() + 60_000).toISOString(),
      });

      const { POST } = await import(
        "@/app/api/auth/apply-diagnosis-to-cast/route"
      );
      const res = await POST(
        makeRequest({
          ...validAnswers,
          photos: ["blob:http://localhost/abc-123"],
        }),
      );

      expect(res.status).toBe(400);
      expect(castUpdateMock).not.toHaveBeenCalled();
    });

    it("photos に blob: と https: が混在しても 400", async () => {
      authMock.mockResolvedValue({
        user: { id: "cast-user", role: "CAST" },
        expires: new Date(Date.now() + 60_000).toISOString(),
      });

      const { POST } = await import(
        "@/app/api/auth/apply-diagnosis-to-cast/route"
      );
      const res = await POST(
        makeRequest({
          ...validAnswers,
          photos: [
            "https://example.com/ok.jpg",
            "blob:http://localhost/bad",
          ],
        }),
      );

      expect(res.status).toBe(400);
      expect(castUpdateMock).not.toHaveBeenCalled();
    });
  });

  // C-2: photos スキーマを https-only allowlist に強化
  describe("C-2: photos の https allowlist", () => {
    beforeEach(() => {
      authMock.mockResolvedValue({
        user: { id: "cast-user", role: "CAST" },
        expires: new Date(Date.now() + 60_000).toISOString(),
      });
    });

    it("photos に大文字始まり 'Blob:' があっても 400 (case-insensitive)", async () => {
      const { POST } = await import(
        "@/app/api/auth/apply-diagnosis-to-cast/route"
      );
      const res = await POST(
        makeRequest({
          ...validAnswers,
          photos: ["Blob:http://localhost/abc-123"],
        }),
      );
      expect(res.status).toBe(400);
      expect(castUpdateMock).not.toHaveBeenCalled();
    });

    it("photos に全大文字 'BLOB:' があっても 400", async () => {
      const { POST } = await import(
        "@/app/api/auth/apply-diagnosis-to-cast/route"
      );
      const res = await POST(
        makeRequest({
          ...validAnswers,
          photos: ["BLOB:http://localhost/abc-123"],
        }),
      );
      expect(res.status).toBe(400);
      expect(castUpdateMock).not.toHaveBeenCalled();
    });

    it("photos に 'data:' URL があると 400", async () => {
      const { POST } = await import(
        "@/app/api/auth/apply-diagnosis-to-cast/route"
      );
      const res = await POST(
        makeRequest({
          ...validAnswers,
          photos: ["data:image/png;base64,iVBORw0KGgo="],
        }),
      );
      expect(res.status).toBe(400);
      expect(castUpdateMock).not.toHaveBeenCalled();
    });

    it("photos に 'javascript:' があると 400 (XSS 防御)", async () => {
      const { POST } = await import(
        "@/app/api/auth/apply-diagnosis-to-cast/route"
      );
      const res = await POST(
        makeRequest({
          ...validAnswers,
          photos: ["javascript:alert(1)"],
        }),
      );
      expect(res.status).toBe(400);
      expect(castUpdateMock).not.toHaveBeenCalled();
    });

    it("photos に 'file://' があると 400 (LFI 防御)", async () => {
      const { POST } = await import(
        "@/app/api/auth/apply-diagnosis-to-cast/route"
      );
      const res = await POST(
        makeRequest({
          ...validAnswers,
          photos: ["file:///etc/passwd"],
        }),
      );
      expect(res.status).toBe(400);
      expect(castUpdateMock).not.toHaveBeenCalled();
    });

    it("photos に 'http://' (非 HTTPS) があると 400", async () => {
      const { POST } = await import(
        "@/app/api/auth/apply-diagnosis-to-cast/route"
      );
      const res = await POST(
        makeRequest({
          ...validAnswers,
          photos: ["http://example.com/x.jpg"],
        }),
      );
      expect(res.status).toBe(400);
      expect(castUpdateMock).not.toHaveBeenCalled();
    });

    it("photos が 'https://' のみなら 200 (allow)", async () => {
      castFindUniqueMock.mockResolvedValue({
        id: "cast-https",
        userId: "cast-user",
        diagnosisCompleted: false,
        description: null,
      });
      castUpdateMock.mockResolvedValue({});

      const { POST } = await import(
        "@/app/api/auth/apply-diagnosis-to-cast/route"
      );
      const res = await POST(
        makeRequest({
          ...validAnswers,
          photos: ["https://example.com/x.jpg"],
        }),
      );
      expect(res.status).toBe(200);
      expect(castUpdateMock).toHaveBeenCalledTimes(1);
    });
  });

  // H-4: 強み追記の重複検出を「行頭マーカー」に
  describe("H-4: 既存 description 内 '強み:' は行頭マーカーで判定", () => {
    beforeEach(() => {
      authMock.mockResolvedValue({
        user: { id: "cast-user", role: "CAST" },
        expires: new Date(Date.now() + 60_000).toISOString(),
      });
      castUpdateMock.mockResolvedValue({});
    });

    it("'私の強み: 笑顔' のような行頭以外の '強み:' では追記される", async () => {
      castFindUniqueMock.mockResolvedValue({
        id: "cast-h4-1",
        userId: "cast-user",
        diagnosisCompleted: false,
        description: "私の強み: 笑顔",
      });

      const { POST } = await import(
        "@/app/api/auth/apply-diagnosis-to-cast/route"
      );
      const res = await POST(
        makeRequest({
          ...validAnswers,
          strengths: ["明るさ"],
        }),
      );

      expect(res.status).toBe(200);
      const args = castUpdateMock.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(args.data.description).toBe(
        "私の強み: 笑顔\n\n強み: 明るさ",
      );
    });

    it("行頭が '強み:' の既存 description は idempotent に追記しない", async () => {
      castFindUniqueMock.mockResolvedValue({
        id: "cast-h4-2",
        userId: "cast-user",
        diagnosisCompleted: false,
        description: "強み: 古い強み",
      });

      const { POST } = await import(
        "@/app/api/auth/apply-diagnosis-to-cast/route"
      );
      const res = await POST(
        makeRequest({
          ...validAnswers,
          strengths: ["明るさ"],
        }),
      );

      expect(res.status).toBe(200);
      const args = castUpdateMock.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(args.data.description).toBeUndefined();
    });

    it("複数行 description で 2 行目が '強み: ...' でも idempotent", async () => {
      castFindUniqueMock.mockResolvedValue({
        id: "cast-h4-3",
        userId: "cast-user",
        diagnosisCompleted: false,
        description: "自己紹介\n強み: 古い強み",
      });

      const { POST } = await import(
        "@/app/api/auth/apply-diagnosis-to-cast/route"
      );
      const res = await POST(
        makeRequest({
          ...validAnswers,
          strengths: ["明るさ"],
        }),
      );

      expect(res.status).toBe(200);
      const args = castUpdateMock.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(args.data.description).toBeUndefined();
    });
  });
});
