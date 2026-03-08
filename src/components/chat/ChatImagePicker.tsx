"use client";

import { useState, useCallback, useRef } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import Image from "next/image";

export interface SelectedImage {
  file: File;
  preview: string;
}

interface ChatImagePickerProps {
  matchId?: string;
  images: SelectedImage[];
  onImagesChange: (images: SelectedImage[]) => void;
  disabled?: boolean;
}

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ChatImagePicker({
  images,
  onImagesChange,
  disabled = false,
}: ChatImagePickerProps) {
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setError(null);

      const remaining = MAX_IMAGES - images.length;
      if (files.length > remaining) {
        setError(`あと${remaining}枚まで選択できます`);
        e.target.value = "";
        return;
      }

      const newImages: SelectedImage[] = [];
      for (const file of Array.from(files)) {
        if (file.size > MAX_FILE_SIZE) {
          setError("ファイルサイズは5MB以下にしてください");
          e.target.value = "";
          return;
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
          setError("JPG、PNG、WebP形式のみ対応しています");
          e.target.value = "";
          return;
        }
        newImages.push({
          file,
          preview: URL.createObjectURL(file),
        });
      }

      onImagesChange([...images, ...newImages]);
      e.target.value = "";
    },
    [images, onImagesChange]
  );

  const handleRemove = useCallback(
    (index: number) => {
      const removed = images[index];
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      onImagesChange(images.filter((_, i) => i !== index));
    },
    [images, onImagesChange]
  );

  return (
    <div>
      {images.length > 0 && (
        <div className="flex gap-2 px-2 pb-2 overflow-x-auto">
          {images.map((img, index) => (
            <div key={img.preview} className="relative shrink-0 w-16 h-16">
              <Image
                src={img.preview}
                alt={`選択画像 ${index + 1}`}
                fill
                className="rounded-lg object-cover"
                sizes="64px"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white shadow-md"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 px-2 pb-1">{error}</p>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || images.length >= MAX_IMAGES}
        className="p-2 text-gray-500 hover:text-(--primary) disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="写真を添付"
      >
        <ImagePlus className="w-5 h-5" />
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        disabled={disabled}
        className="hidden"
      />
    </div>
  );
}

/**
 * 選択された画像をSupabase Storageにアップロード
 */
export async function uploadChatImages(
  matchId: string,
  images: SelectedImage[]
): Promise<string[]> {
  const urls: string[] = [];

  for (const img of images) {
    const fileExt = img.file.name.split(".").pop()?.toLowerCase() || "jpg";

    // 署名付きURL取得
    const response = await fetch("/api/upload/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, fileExt }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "アップロードURLの取得に失敗しました");
    }

    const { signedUrl, publicUrl } = await response.json();

    // Supabase Storageに直接アップロード
    const uploadResponse = await fetch(signedUrl, {
      method: "PUT",
      headers: { "Content-Type": img.file.type },
      body: img.file,
    });

    if (!uploadResponse.ok) {
      throw new Error("画像のアップロードに失敗しました");
    }

    urls.push(publicUrl);
  }

  return urls;
}
