"use client";

import Image from "next/image";

interface MessageImage {
  id: string;
  url: string;
  order: number;
}

interface MessageBubbleData {
  id: string;
  content: string | null;
  isRead: boolean;
  createdAt: Date | string;
  senderId: string;
  images: MessageImage[];
}

interface MessageBubbleProps {
  message: MessageBubbleData;
  isOwn: boolean;
  showReadIndicator: boolean;
}

function formatTime(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function MessageBubble({
  message,
  isOwn,
  showReadIndicator,
}: MessageBubbleProps) {
  const hasImages = message.images.length > 0;
  const hasText = !!message.content && message.content.trim().length > 0;

  return (
    <div
      className={`flex items-end gap-1.5 ${isOwn ? "justify-end" : "justify-start"}`}
    >
      {isOwn && showReadIndicator && (
        <div className="flex flex-col items-end gap-0.5 pb-1 text-[10px] text-gray-400 leading-none">
          {message.isRead && <span>既読</span>}
          <span>{formatTime(message.createdAt)}</span>
        </div>
      )}

      <div
        className={`flex flex-col gap-1 max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}
      >
        {hasImages && (
          <div
            className={`grid gap-1 ${message.images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
          >
            {message.images.map((img) => (
              <a
                key={img.id}
                href={img.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block overflow-hidden rounded-xl bg-gray-100"
                style={{ width: "160px", height: "160px" }}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="160px"
                  unoptimized
                />
              </a>
            ))}
          </div>
        )}

        {hasText && (
          <div
            className={`
              px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words
              ${
                isOwn
                  ? "bg-(--primary) text-white rounded-br-md"
                  : "bg-gray-100 text-gray-900 rounded-bl-md"
              }
            `}
          >
            {message.content}
          </div>
        )}
      </div>

      {!isOwn && (
        <span className="pb-1 text-[10px] text-gray-400 leading-none">
          {formatTime(message.createdAt)}
        </span>
      )}
    </div>
  );
}
