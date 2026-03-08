"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { RankBadge } from "@/components/ui/rank-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TabFilter } from "@/components/ui/tab-filter";
import { Thumbnail } from "@/components/ui/thumbnail";
import { trpc } from "@/lib/trpc";
import { type MatchStatus } from "@prisma/client";
import { Heart, MessageCircle } from "lucide-react";

const STATUS_TABS = [
  { value: "ACCEPTED", label: "やりとり中" },
  { value: "PENDING", label: "承諾待ち" },
  { value: "REJECTED", label: "辞退済み" },
];

export default function StoreMatchesPage() {
  const [status, setStatus] = useState<MatchStatus>("ACCEPTED");

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.match.getMatches.useInfiniteQuery(
      { status, limit: 20 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

  const matches = data?.pages.flatMap((page) => page.matches) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-(--text-main)">やりとり</h1>
        <p className="text-(--text-sub) mt-1">応募・承諾済みのキャストとやりとりできます</p>
      </div>

      <TabFilter
        tabs={STATUS_TABS}
        activeValue={status}
        onChange={(v) => setStatus(v as MatchStatus)}
        variant="pill"
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : matches.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={
            status === "ACCEPTED"
              ? "やりとり中のキャストがいません"
              : status === "PENDING"
              ? "承諾待ちのキャストがいません"
              : "辞退されたキャストがいません"
          }
          action={status === "ACCEPTED" ? { label: "キャストを検索する", href: "/store/casts" } : undefined}
        />
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <Card key={match.id} className="p-4">
              <div className="flex gap-4">
                <Thumbnail
                  src={match.cast?.photos?.[0]}
                  alt={match.cast?.nickname ?? "キャスト"}
                  shape="circle"
                  fallbackType="user"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-(--text-main)">
                      {match.cast?.nickname ?? "キャスト"}
                    </h3>
                    {match.cast?.rank && <RankBadge rank={match.cast.rank} />}
                  </div>
                  <p className="text-sm text-(--text-sub)">{match.cast?.age}歳</p>
                  <p className="text-xs text-gray-400 mt-1">
                    やりとり開始日: {new Date(match.createdAt).toLocaleDateString("ja-JP")}
                  </p>
                </div>

                <div className="flex items-center">
                  {status === "ACCEPTED" && (
                    <Link href={`/store/chat/${match.id}`}>
                      <Button size="sm">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        チャット
                      </Button>
                    </Link>
                  )}
                  {status === "PENDING" && (
                    <span className="text-sm text-yellow-600 font-medium">返答待ち</span>
                  )}
                  {status === "REJECTED" && (
                    <span className="text-sm text-gray-400">辞退済み</span>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                isLoading={isFetchingNextPage}
              >
                もっと見る
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
