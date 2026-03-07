import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createSignedUploadUrl,
  getPublicUrl,
  deleteCastPhoto,
} from "@/lib/supabase-storage";
import { prisma } from "@/server/db";
import { analyzeEla } from "@/lib/image-analysis/ela";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function getExtFromType(type: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return map[type] || "jpg";
}

/**
 * 署名付きアップロードURL生成（ELA加工検出付き）
 * POST /api/upload (FormData: file)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "ファイルが必要です" },
        { status: 400 }
      );
    }

    // ファイル形式チェック
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "JPG、PNG、WebP形式のみ対応しています" },
        { status: 400 }
      );
    }

    // ファイルサイズチェック
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "ファイルサイズは10MB以下にしてください" },
        { status: 400 }
      );
    }

    // ELA解析
    const buffer = Buffer.from(await file.arrayBuffer());
    const elaResult = await analyzeEla(buffer);

    if (elaResult.isManipulated) {
      return NextResponse.json(
        {
          error:
            "この写真は加工が検出されました。無加工の写真をアップロードしてください。",
          elaScore: elaResult.score,
        },
        { status: 422 }
      );
    }

    // キャストIDを取得
    const cast = await prisma.cast.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!cast) {
      return NextResponse.json({ error: "Cast not found" }, { status: 404 });
    }

    const fileExt = getExtFromType(file.type);
    const { signedUrl, path } = await createSignedUploadUrl(cast.id, fileExt);
    const publicUrl = getPublicUrl(path);

    return NextResponse.json({
      signedUrl,
      path,
      publicUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 }
    );
  }
}

/**
 * 写真削除
 * DELETE /api/upload
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    // キャストの写真かどうか確認
    const cast = await prisma.cast.findUnique({
      where: { userId: session.user.id },
      select: { id: true, photos: true },
    });

    if (!cast) {
      return NextResponse.json({ error: "Cast not found" }, { status: 404 });
    }

    // 自分の写真かどうか確認
    if (!cast.photos.includes(url)) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    await deleteCastPhoto(url);

    // データベースから削除
    await prisma.cast.update({
      where: { id: cast.id },
      data: {
        photos: cast.photos.filter((p) => p !== url),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    );
  }
}
