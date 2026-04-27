"use client";

import { useState, useCallback, useRef } from "react";
import { Camera, X, Loader2, ImageIcon } from "lucide-react";
import Image from "next/image";

interface StoreSingleImageUploaderProps {
  currentUrl: string | null;
  onUrlChange: (url: string | null) => void;
  aspectRatio: "banner" | "logo";
  placeholder: string;
  deleteType: "banner" | "logo";
}

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

function validateImageFile(file: File): string | null {
  if (file.size > MAX_SIZE_BYTES) {
    return "ファイルサイズは10MB以下にしてください";
  }
  const mimeOk = ALLOWED_MIME.includes(file.type);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const extOk = ALLOWED_EXT.includes(ext);
  if (!mimeOk || !extOk) {
    return "JPG、PNG、WebP形式のみ対応しています";
  }
  return null;
}

export function StoreSingleImageUploader({
  currentUrl,
  onUrlChange,
  aspectRatio,
  deleteType,
}: StoreSingleImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        e.target.value = "";
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";

        const response = await fetch("/api/upload/store", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileExt }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "アップロードURLの取得に失敗しました");
        }

        const { signedUrl, publicUrl } = await response.json();

        const uploadResponse = await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error("画像のアップロードに失敗しました");
        }

        // 旧画像をベストエフォートで削除
        if (currentUrl) {
          fetch("/api/upload/store", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: currentUrl, type: deleteType }),
          }).catch(() => {});
        }

        // 新 URL を反映する前に imageLoaded をリセットして load 完了を待つ表示にする
        setImageLoaded(false);
        onUrlChange(publicUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "アップロードに失敗しました");
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    },
    [currentUrl, deleteType, onUrlChange],
  );

  const handleRemove = useCallback(async () => {
    if (!currentUrl) return;

    try {
      await fetch("/api/upload/store", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: currentUrl, type: deleteType }),
      });
    } catch {
      // 削除失敗しても UI からは削除
    }

    setImageLoaded(false);
    onUrlChange(null);
  }, [currentUrl, deleteType, onUrlChange]);

  const isLogo = aspectRatio === "logo";
  const containerClass = isLogo
    ? "relative w-24 h-24 rounded-lg overflow-hidden group"
    : "relative w-full aspect-[3/1] rounded-lg overflow-hidden group";

  // ロゴ枠 (96x96) に「変更」「削除」が並ぶと幅が足りない (~150px 必要) ため、
  // ロゴはフルカバーのオーバーレイ (アイコンのみ) で操作。
  // バナーは従来通り bottom-right にチップ表示。
  const overlayClass = isLogo
    ? "absolute inset-0 flex items-center justify-center gap-1.5 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
    : "absolute bottom-2 right-2 flex gap-1.5";

  const showSkeleton = !!currentUrl && (!imageLoaded || isUploading);

  return (
    <div className="space-y-2">
      <div className={containerClass}>
        {currentUrl ? (
          <>
            <Image
              src={currentUrl}
              alt={deleteType === "banner" ? "バナー画像" : "ロゴ画像"}
              fill
              className="object-cover"
              sizes={aspectRatio === "banner" ? "100vw" : "96px"}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageLoaded(false);
                setError("画像の読み込みに失敗しました");
              }}
              unoptimized
            />
            {showSkeleton && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            )}
            <div className={overlayClass}>
              {isLogo ? (
                <>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={isUploading}
                    aria-label="変更"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm transition-colors hover:bg-white"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={isUploading}
                    aria-label="削除"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/90 text-white shadow-sm transition-colors hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-1 rounded-md bg-white/90 px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    変更
                  </button>
                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={isUploading}
                    className="flex items-center gap-1 rounded-md bg-red-500/90 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                    削除
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className={`flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-slate-400 hover:bg-slate-50 ${
              isUploading ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            ) : (
              <>
                <ImageIcon className="h-6 w-6 text-gray-400" />
                <span className="mt-1.5 text-xs text-gray-500">
                  {aspectRatio === "banner" ? "バナーをアップロード" : "ロゴをアップロード"}
                </span>
              </>
            )}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <p className="text-xs text-gray-400">
        JPG, PNG, WebP ・ 最大10MB
        {aspectRatio === "banner" && " ・ 横長画像推奨"}
      </p>
    </div>
  );
}
