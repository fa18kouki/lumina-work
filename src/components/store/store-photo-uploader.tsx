"use client";

import { useState, useCallback } from "react";
import { Camera, X, Upload, Loader2 } from "lucide-react";
import Image from "next/image";

interface StorePhotoUploaderProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export function StorePhotoUploader({
  photos,
  onPhotosChange,
  maxPhotos = 5,
}: StorePhotoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      if (photos.length + files.length > maxPhotos) {
        setError(`写真は最大${maxPhotos}枚までです`);
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        const uploadedUrls: string[] = [];

        for (const file of Array.from(files)) {
          if (file.size > 20 * 1024 * 1024) {
            throw new Error("ファイルサイズは20MB以下にしてください");
          }

          const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
          if (!allowedTypes.includes(file.type)) {
            throw new Error("JPG、PNG、WebP形式のみ対応しています");
          }

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
            throw new Error("写真のアップロードに失敗しました");
          }

          uploadedUrls.push(publicUrl);
        }

        onPhotosChange([...photos, ...uploadedUrls]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "アップロードに失敗しました");
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    },
    [photos, maxPhotos, onPhotosChange]
  );

  const handleRemovePhoto = useCallback(
    async (index: number) => {
      const url = photos[index];

      try {
        await fetch("/api/upload/store", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
      } catch {
        // 削除に失敗しても UI からは削除
      }

      const newPhotos = photos.filter((_, i) => i !== index);
      onPhotosChange(newPhotos);
    },
    [photos, onPhotosChange]
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {photos.map((url, index) => (
          <div key={url} className="relative aspect-square">
            <Image
              src={url}
              alt={`店舗写真 ${index + 1}`}
              fill
              className="rounded-lg object-cover"
              sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
            />
            <button
              type="button"
              onClick={() => handleRemovePhoto(index)}
              className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-md transition-colors hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <label
            className={`flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-slate-400 hover:bg-slate-50 ${
              isUploading ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
            />
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
            ) : (
              <>
                <Camera className="h-8 w-8 text-gray-400" />
                <span className="mt-2 text-xs text-gray-500">写真を追加</span>
              </>
            )}
          </label>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Upload className="h-4 w-4" />
        <span>
          {photos.length}/{maxPhotos}枚 ・ JPG, PNG, WebP ・ 最大20MB
        </span>
      </div>

      <p className="text-xs text-gray-400">
        店内の雰囲気が伝わる写真をアップロードしてください
      </p>
    </div>
  );
}
