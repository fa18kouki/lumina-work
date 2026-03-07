import { describe, it, expect, vi, beforeEach } from "vitest";
import sharp from "sharp";

// モック設定
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/server/db", () => ({
  prisma: {
    cast: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/supabase-storage", () => ({
  createSignedUploadUrl: vi.fn(),
  getPublicUrl: vi.fn(),
}));

vi.mock("@/lib/image-analysis/ela", () => ({
  analyzeEla: vi.fn(),
}));

import { POST } from "@/app/api/upload/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db";
import {
  createSignedUploadUrl,
  getPublicUrl,
} from "@/lib/supabase-storage";
import { analyzeEla } from "@/lib/image-analysis/ela";
import { NextRequest } from "next/server";

function createFormDataRequest(file: Buffer, filename: string, contentType: string): NextRequest {
  const formData = new FormData();
  const blob = new Blob([file], { type: contentType });
  formData.append("file", blob, filename);

  return new NextRequest("http://localhost:3000/api/upload", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未認証の場合401を返す", async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const image = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 128, g: 128, b: 128 } },
    }).jpeg().toBuffer();

    const request = createFormDataRequest(image, "test.jpg", "image/jpeg");
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it("ファイルがない場合400を返す", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);

    const request = new NextRequest("http://localhost:3000/api/upload", {
      method: "POST",
      body: new FormData(),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("不正なファイル形式の場合400を返す", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);

    const request = createFormDataRequest(
      Buffer.from("not an image"),
      "test.txt",
      "text/plain"
    );

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("ELA検出で加工画像の場合422を返す", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    vi.mocked(prisma.cast.findUnique).mockResolvedValue({ id: "cast-1" } as never);
    vi.mocked(analyzeEla).mockResolvedValue({
      score: 65,
      isManipulated: true,
      details: { meanDifference: 10, stdDeviation: 25, maxDifference: 200, highDiffRatio: 0.05 },
    });

    const image = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 128, g: 128, b: 128 } },
    }).jpeg().toBuffer();

    const request = createFormDataRequest(image, "test.jpg", "image/jpeg");
    const response = await POST(request);

    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error).toContain("加工");
  });

  it("ELA通過で署名付きURLを返す", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    vi.mocked(prisma.cast.findUnique).mockResolvedValue({ id: "cast-1" } as never);
    vi.mocked(analyzeEla).mockResolvedValue({
      score: 10,
      isManipulated: false,
      details: { meanDifference: 1, stdDeviation: 0.5, maxDifference: 5, highDiffRatio: 0 },
    });
    vi.mocked(createSignedUploadUrl).mockResolvedValue({
      signedUrl: "https://example.com/upload",
      path: "cast-photos/cast-1/photo.jpg",
    });
    vi.mocked(getPublicUrl).mockReturnValue("https://example.com/public/photo.jpg");

    const image = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 128, g: 128, b: 128 } },
    }).jpeg().toBuffer();

    const request = createFormDataRequest(image, "test.jpg", "image/jpeg");
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.signedUrl).toBe("https://example.com/upload");
    expect(body.publicUrl).toBe("https://example.com/public/photo.jpg");
  });

  it("キャストが見つからない場合404を返す", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    vi.mocked(prisma.cast.findUnique).mockResolvedValue(null);
    vi.mocked(analyzeEla).mockResolvedValue({
      score: 5,
      isManipulated: false,
      details: { meanDifference: 0.5, stdDeviation: 0.2, maxDifference: 2, highDiffRatio: 0 },
    });

    const image = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 128, g: 128, b: 128 } },
    }).jpeg().toBuffer();

    const request = createFormDataRequest(image, "test.jpg", "image/jpeg");
    const response = await POST(request);

    expect(response.status).toBe(404);
  });
});
