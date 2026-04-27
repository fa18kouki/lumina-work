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
      select: {
        id: true,
        photos: true,
        bannerUrl: true,
        logoUrl: true,
      },
    });
    if (!store) {
      return { error: "Store not found" as const, status: 404 };
    }
    return { store };
  }

  const fallback = await prisma.store.findFirst({
    where: { ownerId: owner.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      photos: true,
      bannerUrl: true,
      logoUrl: true,
    },
  });
  if (!fallback) {
    return { error: "Store not found" as const, status: 404 };
  }
  return { store: fallback };
}

/**
 * 署名付きアップロードURL生成
 * POST /api/upload/store
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileExt, storeId } = body as {
      fileExt?: string;
      storeId?: string;
    };

    if (!fileExt || typeof fileExt !== "string") {
      return NextResponse.json(
        { error: "fileExt is required" },
        { status: 400 },
      );
    }

    const allowedExtensions = ["jpg", "jpeg", "png", "webp"];
    if (!allowedExtensions.includes(fileExt.toLowerCase())) {
      return NextResponse.json(
        { error: "Invalid file extension" },
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
 * 店舗写真削除
 * DELETE /api/upload/store
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, type = "photo", storeId } = body as {
      url?: string;
      type?: "photo" | "banner" | "logo";
      storeId?: string;
    };

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    if (!["photo", "banner", "logo"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const resolved = await resolveOwnerStore(storeId);
    if ("error" in resolved) {
      return NextResponse.json(
        { error: resolved.error },
        { status: resolved.status },
      );
    }

    const store = resolved.store;

    if (type === "banner") {
      if (store.bannerUrl !== url) {
        return NextResponse.json(
          { error: "Banner not found" },
          { status: 404 },
        );
      }
      await deleteStorePhoto(url);
      await prisma.store.update({
        where: { id: store.id },
        data: { bannerUrl: null },
      });
    } else if (type === "logo") {
      if (store.logoUrl !== url) {
        return NextResponse.json({ error: "Logo not found" }, { status: 404 });
      }
      await deleteStorePhoto(url);
      await prisma.store.update({
        where: { id: store.id },
        data: { logoUrl: null },
      });
    } else {
      if (!store.photos.includes(url)) {
        return NextResponse.json(
          { error: "Photo not found" },
          { status: 404 },
        );
      }
      await deleteStorePhoto(url);
      await prisma.store.update({
        where: { id: store.id },
        data: {
          photos: store.photos.filter((p) => p !== url),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[upload/store] DELETE error", error);
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 },
    );
  }
}
