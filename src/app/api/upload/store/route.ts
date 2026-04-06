import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createSignedStoreUploadUrl,
  getStorePublicUrl,
  deleteStorePhoto,
} from "@/lib/supabase-storage";
import { prisma } from "@/server/db";

/**
 * 署名付きアップロードURL生成
 * POST /api/upload/store
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fileExt } = body;

    if (!fileExt || typeof fileExt !== "string") {
      return NextResponse.json(
        { error: "fileExt is required" },
        { status: 400 }
      );
    }

    const allowedExtensions = ["jpg", "jpeg", "png", "webp"];
    if (!allowedExtensions.includes(fileExt.toLowerCase())) {
      return NextResponse.json(
        { error: "Invalid file extension" },
        { status: 400 }
      );
    }

    const owner = await prisma.owner.findUnique({
      where: { userId: session.user.id },
      select: { stores: { select: { id: true }, take: 1 } },
    });

    const store = owner?.stores[0];
    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const { signedUrl, path } = await createSignedStoreUploadUrl(
      store.id,
      fileExt
    );
    const publicUrl = getStorePublicUrl(path);

    return NextResponse.json({
      signedUrl,
      path,
      publicUrl,
    });
  } catch (error) {
    console.error("Store upload error:", error);
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 }
    );
  }
}

/**
 * 店舗写真削除
 * DELETE /api/upload/store
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url, type = "photo" } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    if (!["photo", "banner", "logo"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const ownerDel = await prisma.owner.findUnique({
      where: { userId: session.user.id },
      select: { stores: { select: { id: true, photos: true, bannerUrl: true, logoUrl: true }, take: 1 } },
    });

    const store = ownerDel?.stores[0];
    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (type === "banner") {
      if (store.bannerUrl !== url) {
        return NextResponse.json({ error: "Banner not found" }, { status: 404 });
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
        return NextResponse.json({ error: "Photo not found" }, { status: 404 });
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
    console.error("Store delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    );
  }
}
