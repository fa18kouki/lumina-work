"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAppSession } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Thumbnail } from "@/components/ui/thumbnail";
import {
  ChatImagePicker,
  uploadChatImages,
  type SelectedImage,
} from "@/components/chat/ChatImagePicker";
import { ImageLightbox } from "@/components/chat/ImageLightbox";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, Send } from "lucide-react";

interface MessageImage {
  id: string;
  url: string;
  order: number;
}

interface ChatMessage {
  id: string;
  content: string | null;
  matchId: string;
  sender: { id: string; role?: string };
  createdAt: Date;
  images?: MessageImage[];
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;
  const { data: session, status } = useAppSession();

  const [message, setMessage] = useState("");
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lightboxImages, setLightboxImages] = useState<{ url: string }[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (session && session.user.role !== "CAST") router.push("/login");
  }, [session, status, router]);

  const { data: messagesData, isLoading } = trpc.message.getMessages.useQuery(
    { matchId, limit: 50 },
    { refetchInterval: 5000 }
  );

  const { data: matchesData } = trpc.match.getMatches.useQuery(
    { status: "ACCEPTED", limit: 1 },
  );

  const sendMessage = trpc.message.send.useMutation({
    onSuccess: () => {
      setMessage("");
      setSelectedImages([]);
      utils.message.getMessages.invalidate({ matchId });
    },
  });

  const messages: ChatMessage[] = (messagesData?.messages ?? []) as ChatMessage[];

  const currentMatch = matchesData?.matches?.find((m) => m.id === matchId);

  const partnerName: string = currentMatch?.store?.name ?? "店舗";
  const partnerArea = currentMatch?.store?.area;
  const partnerPhoto = currentMatch?.store?.photos?.[0];
  const partnerId = currentMatch?.store?.id;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const hasText = message.trim().length > 0;
    const hasImages = selectedImages.length > 0;
    if (!hasText && !hasImages) return;

    setUploadError(null);
    let imageUrls: string[] | undefined;

    if (hasImages) {
      setIsUploading(true);
      try {
        imageUrls = await uploadChatImages(matchId, selectedImages);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "アップロードに失敗しました");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    sendMessage.mutate({
      matchId,
      content: hasText ? message : undefined,
      imageUrls,
    });
  }, [message, selectedImages, matchId, sendMessage]);

  const openLightbox = useCallback((images: MessageImage[], index: number) => {
    setLightboxImages(images.map((img) => ({ url: img.url })));
    setLightboxIndex(index);
  }, []);

  if (status === "loading" || !session || session.user.role !== "CAST" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
        <Link href="/matches" className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex items-center gap-3">
          <Thumbnail
            src={partnerPhoto}
            alt={partnerName}
            size="sm"
            shape="circle"
            fallbackType="store"
          />
          <div>
            <p className="font-medium text-(--text-main)">{partnerName}</p>
            {partnerArea && <p className="text-xs text-(--text-sub)">{partnerArea}</p>}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-(--text-sub) py-8">
            <p>メッセージはまだありません</p>
            <p className="text-sm mt-1">最初のメッセージを送ってみましょう</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender.id !== partnerId;
            const msgImages = msg.images ?? [];
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-2xl ${
                    isOwn
                      ? "bg-(--primary) text-white rounded-br-md"
                      : "bg-gray-100 text-(--text-main) rounded-bl-md"
                  } ${msgImages.length > 0 ? "p-1.5" : "px-4 py-2"}`}
                >
                  {msgImages.length > 0 && (
                    <MessageImageGrid
                      images={msgImages}
                      onImageClick={(index) => openLightbox(msgImages, index)}
                    />
                  )}
                  {msg.content && (
                    <p className={`text-sm whitespace-pre-wrap ${msgImages.length > 0 ? "px-2.5 pt-1.5 pb-1" : ""}`}>
                      {msg.content}
                    </p>
                  )}
                  <p
                    className={`text-xs mt-1 ${msgImages.length > 0 ? "px-2.5 pb-1" : ""} ${
                      isOwn ? "text-white/70" : "text-gray-400"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString("ja-JP", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="pt-4 border-t border-gray-200">
        {uploadError && (
          <p className="text-xs text-red-500 px-2 pb-2">{uploadError}</p>
        )}
        <div className="flex items-end gap-2">
          <ChatImagePicker
            matchId={matchId}
            images={selectedImages}
            onImagesChange={setSelectedImages}
            disabled={isUploading || sendMessage.isPending}
          />
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent"
          />
          <Button
            type="submit"
            disabled={(!message.trim() && selectedImages.length === 0) || isUploading}
            isLoading={isUploading || sendMessage.isPending}
            className="rounded-full px-6"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>

      {lightboxImages && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxImages(null)}
        />
      )}
    </div>
  );
}

function MessageImageGrid({
  images,
  onImageClick,
}: {
  images: MessageImage[];
  onImageClick: (index: number) => void;
}) {
  if (images.length === 1) {
    return (
      <button
        type="button"
        onClick={() => onImageClick(0)}
        className="relative w-full aspect-[4/3] rounded-xl overflow-hidden"
      >
        <Image
          src={images[0].url}
          alt="送信画像"
          fill
          className="object-cover"
          sizes="(max-width: 640px) 70vw, 50vw"
        />
      </button>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
      {images.map((img, index) => (
        <button
          key={img.id}
          type="button"
          onClick={() => onImageClick(index)}
          className="relative aspect-square overflow-hidden"
        >
          <Image
            src={img.url}
            alt={`送信画像 ${index + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 35vw, 25vw"
          />
        </button>
      ))}
    </div>
  );
}
