"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { RankBadge } from "@/components/ui/rank-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TabFilter } from "@/components/ui/tab-filter";
import { Thumbnail } from "@/components/ui/thumbnail";
import { trpc } from "@/lib/trpc";
import { Mail, Phone, ExternalLink } from "lucide-react";

const STATUS_TABS = [
  { value: "ALL", label: "すべて" },
  { value: "PENDING", label: "待機中" },
  { value: "ACCEPTED", label: "承諾" },
  { value: "REJECTED", label: "辞退" },
  { value: "EXPIRED", label: "期限切れ" },
];

export default function StoreOffersPage() {
  const [status, setStatus] = useState<"PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | undefined>(
    undefined
  );

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.store.getSentOffers.useInfiniteQuery(
      { status, limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor }
    );

  const offers = data?.pages.flatMap((page) => page.offers) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-(--text-main)">オファー管理</h1>
        <p className="text-(--text-sub) mt-1">送信したオファーの状況を確認できます</p>
      </div>

      <TabFilter
        tabs={STATUS_TABS}
        activeValue={status ?? "ALL"}
        onChange={(v) => setStatus(v === "ALL" ? undefined : v as typeof status)}
        variant="pill"
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : offers.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="オファーがありません"
          description="キャストを検索してオファーを送りましょう"
        />
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <Card key={offer.id} className="p-4">
              <div className="flex gap-4">
                <Thumbnail
                  src={offer.cast?.photos?.[0]}
                  alt={offer.cast?.nickname ?? "キャスト"}
                  size="lg"
                  fallbackType="user"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-(--text-main)">
                          {offer.cast?.nickname ?? "キャスト"}
                        </h3>
                        {offer.cast?.rank && <RankBadge rank={offer.cast.rank} />}
                      </div>
                      <p className="text-sm text-(--text-sub)">
                        {offer.cast?.age}歳
                      </p>
                    </div>
                    <StatusBadge status={offer.status} variant="offer" />
                  </div>

                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 line-clamp-2">{offer.message}</p>
                  </div>

                  {offer.status === "ACCEPTED" && offer.cast && (offer.cast.user?.phone || offer.cast.user?.email || offer.cast.lineId) && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                      <p className="text-xs font-medium text-green-700 mb-2">キャスト連絡先</p>
                      <div className="flex flex-wrap gap-3">
                        {offer.cast.user?.phone && (
                          <a
                            href={`tel:${offer.cast.user.phone}`}
                            className="inline-flex items-center gap-1.5 text-xs text-(--text-main) hover:text-(--primary)"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {offer.cast.user.phone}
                          </a>
                        )}
                        {offer.cast.user?.email && (
                          <a
                            href={`mailto:${offer.cast.user.email}`}
                            className="inline-flex items-center gap-1.5 text-xs text-(--text-main) hover:text-(--primary)"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            {offer.cast.user.email}
                          </a>
                        )}
                        {offer.cast.lineId && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-(--text-main)">
                            <ExternalLink className="w-3.5 h-3.5" />
                            LINE: {offer.cast.lineId}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      送信日: {new Date(offer.createdAt).toLocaleDateString("ja-JP")}
                    </p>
                    {offer.status === "PENDING" && (
                      <p className="text-xs text-yellow-600">
                        有効期限: {new Date(offer.expiresAt).toLocaleDateString("ja-JP")}
                      </p>
                    )}
                  </div>
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
