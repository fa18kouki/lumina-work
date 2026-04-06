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

export function StoreSingleImageUploader({
  currentUrl,
  onUrlChange,
  aspectRatio,
  placeholder,
  deleteType,
}: StoreSingleImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
        setError("ファイルサイズは10MB以下にしてください");
        return;
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        setError("JPG、PNG、WebP形式のみ対応しています");
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
          throw new Error(data.error || "アップロードURLの取得に失敗しま���た");
        }

        const { signedUrl, publicUrl } = await response.json();

        const uploadResponse = await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error("画像のアップロードに失��しました");
        }

        // 旧画像をベストエフォートで削除
        if (currentUrl) {
          fetch("/api/upload/store", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: currentUrl, type: deleteType }),
          }).catch(() => {});
        }

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

    onUrlChange(null);
  }, [currentUrl, deleteType, onUrlChange]);

  const containerClass =
    aspectRatio === "banner"
      ? "relative w-full aspect-[3/1] rounded-lg overflow-hidden"
      : "relative w-24 h-24 rounded-lg overflow-hidden";

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
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
            <div className="absolute bottom-2 right-2 flex gap-1.5">
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
          accept="image/jpeg,image/png,image/webp"
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
