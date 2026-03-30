import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createSignedChatUploadUrl,
  getChatPublicUrl,
} from "@/lib/supabase-storage";
import { prisma } from "@/server/db";

/**
 * チャット画像用の署名付きアップロードURL生成
 * POST /api/upload/chat
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { matchId, fileExt } = body;

    if (!matchId || typeof matchId !== "string") {
      return NextResponse.json(
        { error: "matchId is required" },
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

    // やりとりの参加者かチェック
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        cast: { select: { id: true } },
        owner: { select: { stores: { select: { id: true } } } },
      },
    });

    const castId = user?.cast?.id;
    const storeIds = user?.owner?.stores.map((s) => s.id) ?? [];

    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        status: "ACCEPTED",
        OR: [
          ...(castId ? [{ castId }] : []),
          ...(storeIds.length > 0 ? [{ storeId: { in: storeIds } }] : []),
        ],
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    const { signedUrl, path } = await createSignedChatUploadUrl(
      matchId,
      fileExt
    );
    const publicUrl = getChatPublicUrl(path);

    return NextResponse.json({
      signedUrl,
      path,
      publicUrl,
    });
  } catch (error) {
    console.error("Chat upload error:", error);
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 }
    );
  }
}
