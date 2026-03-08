"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { RankBadge } from "@/components/ui/rank-badge";
import { Thumbnail } from "@/components/ui/thumbnail";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, Send } from "lucide-react";

export default function StoreChatPage() {
  const params = useParams();
  const matchId = params.matchId as string;

  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

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
      utils.message.getMessages.invalidate({ matchId });
    },
  });

  const messages = messagesData?.messages ?? [];

  const currentMatch = matchesData?.matches?.find((m) => m.id === matchId);

  const partnerName: string = currentMatch?.cast?.nickname ?? "キャスト";
  const partnerAge = currentMatch?.cast?.age;
  const partnerRank = currentMatch?.cast?.rank;
  const partnerPhoto = currentMatch?.cast?.photos?.[0];
  const partnerId = currentMatch?.cast?.id;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMessage.mutate({ matchId, content: message });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
        <Link href="/store/matches" className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex items-center gap-3">
          <Thumbnail
            src={partnerPhoto}
            alt={partnerName}
            size="sm"
            shape="circle"
            fallbackType="user"
          />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-(--text-main)">{partnerName}</p>
              {partnerRank && <RankBadge rank={partnerRank} />}
            </div>
            {partnerAge && <p className="text-xs text-(--text-sub)">{partnerAge}歳</p>}
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
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] px-4 py-2 rounded-lg ${
                    isOwn
                      ? "bg-slate-800 text-white rounded-br-sm"
                      : "bg-gray-100 text-(--text-main) rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
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
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
          />
          <Button
            type="submit"
            disabled={!message.trim()}
            isLoading={sendMessage.isPending}
            className="rounded-md px-6"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
