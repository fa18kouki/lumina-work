"use client";

import { useCallback, useRef, useState } from "react";
import { Camera, Film, ImageIcon, Loader2, X } from "lucide-react";
import Image from "next/image";

interface StoreMediaListUploaderProps {
  urls: string[];
  onUrlsChange: (urls: string[]) => void;
  storeId: string;
  /** "image": jpg/png/webp / "animated": gif/mp4/webm */
  mediaType: "image" | "animated";
  maxCount: number;
  addLabel?: string;
}

const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_EXT = ["jpg", "jpeg", "png", "webp"];
const ANIMATED_MIME = ["image/gif", "video/mp4", "video/webm"];
const ANIMATED_EXT = ["gif", "mp4", "webm"];

const MAX_SIZE_IMAGE = 10 * 1024 * 1024;
const MAX_SIZE_ANIMATED = 100 * 1024 * 1024;

function validateMedia(
  file: File,
  mediaType: "image" | "animated",
): string | null {
  const isAnimated = mediaType === "animated";
  const allowedMime = isAnimated ? ANIMATED_MIME : IMAGE_MIME;
  const allowedExt = isAnimated ? ANIMATED_EXT : IMAGE_EXT;
  const maxSize = isAnimated ? MAX_SIZE_ANIMATED : MAX_SIZE_IMAGE;

  if (file.size > maxSize) {
    return `ファイルサイズは${Math.round(maxSize / 1024 / 1024)}MB以下にしてください`;
  }
  const mimeOk = allowedMime.includes(file.type);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const extOk = allowedExt.includes(ext);
  if (!mimeOk || !extOk) {
    return isAnimated
      ? "GIF・MP4・WebM形式のみ対応しています"
      : "JPG・PNG・WebP形式のみ対応しています";
  }
  return null;
}

function inferMediaKind(url: string): "image" | "video" {
  const cleaned = url.split("?")[0].split("#")[0];
  const ext = cleaned.split(".").pop()?.toLowerCase() ?? "";
  return ["mp4", "webm"].includes(ext) ? "video" : "image";
}

export function StoreMediaListUploader({
  urls,
  onUrlsChange,
  storeId,
  mediaType,
  maxCount,
  addLabel,
}: StoreMediaListUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      if (urls.length >= maxCount) {
        setError(`最大 ${maxCount} 件までアップロードできます`);
        return;
      }

      const validationError = validateMedia(file, mediaType);
      if (validationError) {
        setError(validationError);
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        const fileExt = file.name.split(".").pop()?.toLowerCase() || "";

        const response = await fetch("/api/upload/store", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileExt, storeId, mediaType }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(
            (data as { error?: string })?.error ??
              "アップロードURLの取得に失敗しました",
          );
        }

        const { signedUrl, publicUrl } = (await response.json()) as {
          signedUrl: string;
          publicUrl: string;
        };

        const uploadResponse = await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error("アップロードに失敗しました");
        }

        onUrlsChange([...urls, publicUrl]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "アップロードに失敗しました",
        );
      } finally {
        setIsUploading(false);
      }
    },
    [urls, onUrlsChange, storeId, mediaType, maxCount],
  );

  const handleRemove = useCallback(
    (url: string) => {
      onUrlsChange(urls.filter((u) => u !== url));
      // Storage 上のファイルもベストエフォートで消す
      fetch("/api/upload/store", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, storeId }),
      }).catch(() => {});
    },
    [urls, onUrlsChange, storeId],
  );

  const accept =
    mediaType === "animated"
      ? ".gif,.mp4,.webm,image/gif,video/mp4,video/webm"
      : ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

  const canAddMore = urls.length < maxCount;
  const fallbackLabel =
    mediaType === "animated" ? "GIF・動画を追加" : "画像を追加";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {urls.map((url, idx) => (
          <MediaThumb
            key={`${url}-${idx}`}
            url={url}
            onRemove={() => handleRemove(url)}
            disabled={isUploading}
          />
        ))}
        {canAddMore && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className={`relative flex aspect-[3/2] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-slate-400 hover:bg-slate-50 ${
              isUploading ? "pointer-events-none opacity-60" : ""
            }`}
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            ) : (
              <>
                {mediaType === "animated" ? (
                  <Film className="h-6 w-6 text-gray-400" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-gray-400" />
                )}
                <span className="mt-1.5 text-xs text-gray-500">
                  {addLabel ?? fallbackLabel}
                </span>
                <span className="text-[10px] text-gray-400">
                  {urls.length} / {maxCount}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={isUploading}
        className="hidden"
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <p className="text-xs text-gray-400">
        {mediaType === "animated"
          ? "GIF / MP4 / WebM ・ 最大100MB"
          : "JPG / PNG / WebP ・ 最大10MB"}
        {` ・ 最大 ${maxCount} 件`}
      </p>
    </div>
  );
}

function MediaThumb({
  url,
  onRemove,
  disabled,
}: {
  url: string;
  onRemove: () => void;
  disabled: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const kind = inferMediaKind(url);

  return (
    <div className="group relative aspect-[3/2] overflow-hidden rounded-lg bg-gray-100">
      {kind === "video" ? (
        <video
          src={url}
          className="h-full w-full object-cover"
          muted
          playsInline
          loop
          autoPlay
          onLoadedData={() => setLoaded(true)}
          onError={() => {
            setLoaded(false);
            setErrored(true);
          }}
        />
      ) : (
        <Image
          src={url}
          alt="店舗メディア"
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, 33vw"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setLoaded(false);
            setErrored(true);
          }}
          unoptimized
        />
      )}
      {!loaded && !errored && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      )}
      {errored && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Camera className="h-5 w-5 text-gray-300" />
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label="削除"
        className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-red-500/90 text-white opacity-0 shadow-sm transition-opacity hover:bg-red-600 group-focus-within:opacity-100 group-hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
