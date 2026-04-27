import { NextRequest, NextResponse } from "next/server";
import {
  getCachedPrismaUserBySupabaseId,
  getCachedSupabaseUser,
} from "@/lib/auth-cached";
import {
  createSignedStoreUploadUrl,
  getStorePublicUrl,
  deleteStorePhoto,
} from "@/lib/supabase-storage";
import { prisma } from "@/server/db";

type MediaType = "image" | "animated";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const ANIMATED_EXTENSIONS = ["gif", "mp4", "webm"];

function allowedExtensionsFor(mediaType: MediaType): string[] {
  return mediaType === "animated" ? ANIMATED_EXTENSIONS : IMAGE_EXTENSIONS;
}

/**
 * リクエスト元の OWNER に紐づく対象 Store を解決する。
 * storeId が指定されていればその ID で検索 (権限チェック付き)、
 * 指定が無ければ最古の 1 件 (旧クライアント互換)。
 */
async function resolveOwnerStore(storeId?: string) {
  const supabaseUser = await getCachedSupabaseUser();
  if (!supabaseUser) {
    return { error: "Unauthorized" as const, status: 401 };
  }

  const prismaUser = await getCachedPrismaUserBySupabaseId(supabaseUser.id);
  if (!prismaUser) {
    return { error: "Unauthorized" as const, status: 401 };
  }
  if (prismaUser.role !== "OWNER") {
    return { error: "Forbidden" as const, status: 403 };
  }

  const owner = await prisma.owner.findUnique({
    where: { userId: prismaUser.id },
    select: { id: true },
  });
  if (!owner) {
    return { error: "Owner not found" as const, status: 404 };
  }

  if (storeId) {
    const store = await prisma.store.findFirst({
      where: { id: storeId, ownerId: owner.id },
      select: { id: true },
    });
    if (!store) {
      return { error: "Store not found" as const, status: 404 };
    }
    return { store };
  }

  const fallback = await prisma.store.findFirst({
    where: { ownerId: owner.id },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!fallback) {
    return { error: "Store not found" as const, status: 404 };
  }
  return { store: fallback };
}

function urlBelongsToStore(url: string, storeId: string): boolean {
  try {
    const parsed = new URL(url);
    // 想定パス: /<bucket>/<storeId>/<filename>
    return parsed.pathname.includes(`/${storeId}/`);
  } catch {
    return false;
  }
}

/**
 * 署名付きアップロードURL生成
 * POST /api/upload/store
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileExt, storeId, mediaType: rawMediaType } = body as {
      fileExt?: string;
      storeId?: string;
      mediaType?: string;
    };

    if (!fileExt || typeof fileExt !== "string") {
      return NextResponse.json(
        { error: "fileExt is required" },
        { status: 400 },
      );
    }

    const mediaType: MediaType =
      rawMediaType === "animated" ? "animated" : "image";

    const allowed = allowedExtensionsFor(mediaType);
    if (!allowed.includes(fileExt.toLowerCase())) {
      return NextResponse.json(
        {
          error: `Invalid file extension for ${mediaType}`,
          allowed,
        },
        { status: 400 },
      );
    }

    const resolved = await resolveOwnerStore(storeId);
    if ("error" in resolved) {
      return NextResponse.json(
        { error: resolved.error },
        { status: resolved.status },
      );
    }

    const { signedUrl, path } = await createSignedStoreUploadUrl(
      resolved.store.id,
      fileExt,
    );
    const publicUrl = getStorePublicUrl(path);

    return NextResponse.json({ signedUrl, path, publicUrl });
  } catch (error) {
    console.error("[upload/store] POST error", error);
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 },
    );
  }
}

/**
 * 店舗メディアを Storage から削除する。
 * DB 上のフィールド更新は form 送信側に委ね、ここでは Storage 上のファイルを消すだけ。
 *
 * DELETE /api/upload/store
 *   body: { url: string, storeId?: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, storeId } = body as {
      url?: string;
      storeId?: string;
    };

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const resolved = await resolveOwnerStore(storeId);
    if ("error" in resolved) {
      return NextResponse.json(
        { error: resolved.error },
        { status: resolved.status },
      );
    }

    const store = resolved.store;

    // URL のパスに /{storeId}/ が含まれていなければ別 Store のリソース削除を試みている可能性 → 拒否
    if (!urlBelongsToStore(url, store.id)) {
      return NextResponse.json(
        { error: "URL does not belong to this store" },
        { status: 403 },
      );
    }

    try {
      await deleteStorePhoto(url);
    } catch (e) {
      // Storage 側での削除失敗 (既に消えている等) は無視
      console.warn("[upload/store] storage delete failed (ignored)", e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[upload/store] DELETE error", error);
    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 },
    );
  }
}
