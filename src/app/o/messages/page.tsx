"use client";

import { MessageCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { MatchListItem } from "@/components/messages/match-list-item";

export default function OwnerMessagesPage() {
  const { data, isLoading } = trpc.match.getMatches.useQuery(
    { status: "ACCEPTED", limit: 50 },
    { refetchInterval: 30_000 },
  );

  const matches = data?.matches ?? [];

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-[var(--text-main)] mb-6">
        メッセージ
      </h1>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-[var(--text-sub)]">
          読み込み中...
        </div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-100 bg-white py-16 text-center">
          <MessageCircle className="h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-[var(--text-main)]">
            まだやりとりはありません
          </p>
          <p className="text-xs text-[var(--text-sub)]">
            キャストがオファーを承諾するとメッセージが開始できます。
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
          {matches.map((match) => (
            <MatchListItem
              key={match.id}
              href={`/o/messages/${match.id}`}
              name={match.cast.nickname ?? "キャスト"}
              subText={match.store.name}
              avatarUrl={match.cast.photos?.[0] ?? null}
              updatedAt={match.updatedAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
