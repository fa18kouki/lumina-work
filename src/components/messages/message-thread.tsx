"use client";

import { useEffect, useMemo, useRef } from "react";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { MessageBubble } from "./message-bubble";
import { MessageInput } from "./message-input";

interface MessageThreadProps {
  matchId: string;
  currentUserId: string;
}

const POLL_INTERVAL_MS = 20_000;

export function MessageThread({
  matchId,
  currentUserId,
}: MessageThreadProps) {
  const utils = trpc.useUtils();
  const bottomRef = useRef<HTMLDivElement>(null);

  const messagesQuery = trpc.message.getMessages.useQuery(
    { matchId, limit: 50 },
    {
      refetchInterval: POLL_INTERVAL_MS,
      refetchOnWindowFocus: true,
    },
  );

  const sendMutation = trpc.message.send.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.message.getMessages.invalidate({ matchId }),
        utils.message.getUnreadCount.invalidate(),
        utils.match.getMatches.invalidate(),
      ]);
    },
  });

  const messages = messagesQuery.data?.messages ?? [];

  // 自分が送ったメッセージのうち最新のもの (既読インジケータを最後の自送信メッセージにだけ出す)
  const lastOwnMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].senderId === currentUserId) {
        return messages[i].id;
      }
    }
    return null;
  }, [messages, currentUserId]);

  // 新規メッセージで最下部にスクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end", behavior: "auto" });
  }, [messages.length]);

  // 画面復帰時に未読数を再取得 (バッジ用)
  useEffect(() => {
    void utils.message.getUnreadCount.invalidate();
  }, [utils, messages.length]);

  const handleSend = async (input: {
    content?: string;
    imageUrls?: string[];
  }) => {
    await sendMutation.mutateAsync({
      matchId,
      content: input.content,
      imageUrls: input.imageUrls,
    });
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-4">
        {messagesQuery.isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-gray-400">
            <p>
              まだメッセージはありません。
              <br />
              最初のメッセージを送ってみましょう。
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={{
                  id: m.id,
                  content: m.content,
                  isRead: m.isRead,
                  createdAt: m.createdAt,
                  senderId: m.senderId,
                  images: m.images,
                }}
                isOwn={m.senderId === currentUserId}
                showReadIndicator={m.id === lastOwnMessageId}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <MessageInput
        matchId={matchId}
        onSend={handleSend}
        disabled={messagesQuery.isLoading}
      />
    </div>
  );
}
