"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2, Send, X } from "lucide-react";

interface MessageInputProps {
  matchId: string;
  onSend: (input: {
    content?: string;
    imageUrls?: string[];
  }) => Promise<unknown>;
  disabled?: boolean;
}

const MAX_IMAGES = 5;
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp"];

interface PendingImage {
  localId: string;
  previewUrl: string;
  publicUrl: string;
}

function validateImageFile(file: File): string | null {
  if (file.size > MAX_SIZE_BYTES) {
    return "ファイルサイズは10MB以下にしてください";
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_MIME.includes(file.type) || !ALLOWED_EXT.includes(ext)) {
    return "JPG、PNG、WebP形式のみ対応しています";
  }
  return null;
}

async function uploadChatImage(
  matchId: string,
  file: File,
): Promise<string> {
  const fileExt = file.name.split(".").pop()?.toLowerCase() ?? "jpg";

  const signRes = await fetch("/api/upload/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ matchId, fileExt }),
  });

  if (!signRes.ok) {
    const data = (await signRes.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(data.error ?? "アップロードURLの取得に失敗しました");
  }

  const { signedUrl, publicUrl } = (await signRes.json()) as {
    signedUrl: string;
    publicUrl: string;
  };

  const putRes = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!putRes.ok) {
    throw new Error("画像のアップロードに失敗しました");
  }

  return publicUrl;
}

export function MessageInput({
  matchId,
  onSend,
  disabled = false,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [pending, setPending] = useState<PendingImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      e.target.value = "";
      if (files.length === 0) return;

      const remaining = MAX_IMAGES - pending.length;
      if (remaining <= 0) {
        setError(`画像は最大${MAX_IMAGES}枚までです`);
        return;
      }

      const targets = files.slice(0, remaining);
      setError(null);
      setIsUploading(true);

      try {
        for (const file of targets) {
          const validationError = validateImageFile(file);
          if (validationError) {
            setError(validationError);
            continue;
          }

          const previewUrl = URL.createObjectURL(file);
          const publicUrl = await uploadChatImage(matchId, file);
          setPending((prev) => [
            ...prev,
            {
              localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              previewUrl,
              publicUrl,
            },
          ]);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "アップロードに失敗しました",
        );
      } finally {
        setIsUploading(false);
      }
    },
    [matchId, pending.length],
  );

  const handleRemovePending = useCallback((localId: string) => {
    setPending((prev) => {
      const target = prev.find((p) => p.localId === localId);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((p) => p.localId !== localId);
    });
  }, []);

  const reset = useCallback(() => {
    setContent("");
    setPending((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      return [];
    });
    setError(null);
  }, []);

  const canSend =
    !disabled &&
    !isSending &&
    !isUploading &&
    (content.trim().length > 0 || pending.length > 0);

  const handleSend = useCallback(async () => {
    if (!canSend) return;

    setIsSending(true);
    setError(null);

    try {
      await onSend({
        content: content.trim() || undefined,
        imageUrls:
          pending.length > 0 ? pending.map((p) => p.publicUrl) : undefined,
      });
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setIsSending(false);
    }
  }, [canSend, content, onSend, pending, reset]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="border-t border-gray-100 bg-white px-3 py-2.5 sm:px-4">
      {pending.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {pending.map((p) => (
            <div
              key={p.localId}
              className="relative h-16 w-16 overflow-hidden rounded-lg bg-gray-100"
            >
              <Image
                src={p.previewUrl}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
                unoptimized
              />
              <button
                type="button"
                onClick={() => handleRemovePending(p.localId)}
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-700 text-white shadow"
                aria-label="削除"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mb-1.5 text-xs text-red-500" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={
            disabled ||
            isSending ||
            isUploading ||
            pending.length >= MAX_IMAGES
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-40"
          aria-label="画像を添付"
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Camera className="h-5 w-5" />
          )}
        </button>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="メッセージを入力 (⌘+Enter で送信)"
          disabled={disabled || isSending}
          maxLength={2000}
          className="flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-(--primary) focus:bg-white focus:outline-none disabled:opacity-60"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--primary) text-white shadow-sm transition-colors disabled:bg-gray-200 disabled:text-gray-400"
          aria-label="送信"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFilesSelected}
          className="hidden"
        />
      </div>
    </div>
  );
}
