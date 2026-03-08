import { NextRequest, NextResponse } from "next/server";
import {
  createSignedDiagnosisUploadUrl,
  getDiagnosisPublicUrl,
} from "@/lib/supabase-storage";

/**
 * 診断用画像の署名付きアップロードURL生成（認証不要）
 * POST /api/upload/diagnosis
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, fileExt } = body;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    if (!fileExt || typeof fileExt !== "string") {
      return NextResponse.json(
        { error: "fileExt is required" },
        { status: 400 }
      );
    }

    // 許可する拡張子
    const allowedExtensions = ["jpg", "jpeg", "png", "webp"];
    if (!allowedExtensions.includes(fileExt.toLowerCase())) {
      return NextResponse.json(
        { error: "Invalid file extension" },
        { status: 400 }
      );
    }

    // Supabase未設定時はモックレスポンスを返す
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return NextResponse.json({
        signedUrl: "",
        path: `diagnosis/${sessionId}/${Date.now()}.${fileExt}`,
        publicUrl: "",
        mock: true,
      });
    }

    const { signedUrl, path } = await createSignedDiagnosisUploadUrl(
      sessionId,
      fileExt
    );
    const publicUrl = getDiagnosisPublicUrl(path);

    return NextResponse.json({
      signedUrl,
      path,
      publicUrl,
    });
  } catch (error) {
    console.error("Diagnosis upload error:", error);
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 }
    );
  }
}
