"use client";

import { use, useState } from "react";
import { FileText, Mail, Phone, MessageCircle, CalendarPlus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { StatusBadge } from "@/components/ui/status-badge";
import { Thumbnail } from "@/components/ui/thumbnail";
import { Button } from "@/components/ui/button";
import { ScheduleInterviewDialog } from "@/components/store/schedule-interview-dialog";

const STATUS_TABS = [
  { value: "", label: "すべて" },
  { value: "PENDING", label: "未回答" },
  { value: "ACCEPTED", label: "承諾済" },
  { value: "REJECTED", label: "辞退済" },
  { value: "EXPIRED", label: "期限切れ" },
] as const;

export default function StoreOffersPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = use(params);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [scheduleTarget, setScheduleTarget] = useState<{
    offerId: string;
    castNickname: string;
  } | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.store.getSentOffers.useInfiniteQuery(
      {
        storeId,
        limit: 20,
        ...(statusFilter && { status: statusFilter as "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" }),
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      }
    );

  const allOffers = data?.pages.flatMap((p) => p.offers) ?? [];

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-[var(--text-main)] mb-6">
        オファー管理
      </h1>

      {/* ステータスフィルター */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === tab.value
                ? "bg-slate-900 text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* コンテンツ */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-[var(--text-sub)]">読み込み中...</div>
        </div>
      ) : allOffers.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-100 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-[var(--text-sub)]">
            {statusFilter ? "該当するオファーがありません" : "まだオファーを送信していません"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {allOffers.map((offer) => {
              const cast = offer.cast;
              const photo = cast?.photos?.[0] ?? null;
              const isAccepted = offer.status === "ACCEPTED";

              return (
                <div
                  key={offer.id}
                  className="bg-white rounded-xl border border-gray-100 p-5"
                >
                  <div className="flex gap-4">
                    {/* キャスト画像 */}
                    <div className="flex-shrink-0">
                      {photo ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
                          <img src={photo} alt={cast?.nickname ?? ""} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <Thumbnail src={null} alt={cast?.nickname ?? ""} fallbackType="user" className="!w-16 !h-16" />
                      )}
                    </div>

                    {/* オファー情報 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[var(--text-main)] truncate">
                          {cast?.nickname ?? "不明"}
                        </span>
                        {cast?.age && (
                          <span className="text-sm text-[var(--text-sub)] flex-shrink-0">{cast.age}歳</span>
                        )}
                        <StatusBadge status={offer.status} variant="offer" />
                      </div>
                      <p className="text-sm text-[var(--text-sub)] line-clamp-2 mb-2">
                        {offer.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-[var(--text-sub)]">
                        <span>
                          送信日: {new Date(offer.createdAt).toLocaleDateString("ja-JP")}
                        </span>
                        <span>
                          期限: {new Date(offer.expiresAt).toLocaleDateString("ja-JP")}
                        </span>
                      </div>

                      {/* 承諾済みの場合のみ連絡先表示 + 面接設定 */}
                      {isAccepted && cast?.user && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-green-800">連絡先情報</p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setScheduleTarget({
                                  offerId: offer.id,
                                  castNickname: cast?.nickname ?? "キャスト",
                                })
                              }
                              className="!py-1 !px-2.5 !text-xs"
                            >
                              <CalendarPlus className="w-3.5 h-3.5 mr-1" />
                              面接を設定
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-green-700">
                            {cast.user.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5" />
                                {cast.user.email}
                              </span>
                            )}
                            {cast.user.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5" />
                                {cast.user.phone}
                              </span>
                            )}
                            {cast.lineId && (
                              <span className="flex items-center gap-1">
                                <MessageCircle className="w-3.5 h-3.5" />
                                {cast.lineId}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {hasNextPage && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "読み込み中..." : "もっと見る"}
              </Button>
            </div>
          )}
        </>
      )}
      {scheduleTarget && (
        <ScheduleInterviewDialog
          open={!!scheduleTarget}
          offerId={scheduleTarget.offerId}
          castNickname={scheduleTarget.castNickname}
          onClose={() => setScheduleTarget(null)}
        />
      )}
    </div>
  );
}
