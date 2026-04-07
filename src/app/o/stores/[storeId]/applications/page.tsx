"use client";

import { use, useState } from "react";
import { Inbox, CheckCircle, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { StatusBadge } from "@/components/ui/status-badge";
import { Thumbnail } from "@/components/ui/thumbnail";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type MatchStatus = "PENDING" | "ACCEPTED" | "REJECTED";

const STATUS_TABS = [
  { value: "", label: "すべて" },
  { value: "PENDING", label: "審査中" },
  { value: "ACCEPTED", label: "承認済" },
  { value: "REJECTED", label: "不採用" },
] as const;

export default function StoreApplicationsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = use(params);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [confirmAction, setConfirmAction] = useState<{
    type: "accept" | "reject";
    matchId: string;
    castName: string;
  } | null>(null);

  const utils = trpc.useUtils();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.match.getMatches.useInfiniteQuery(
      {
        limit: 20,
        ...(statusFilter && { status: statusFilter as MatchStatus }),
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        initialCursor: undefined,
      }
    );

  const updateStatusMutation = trpc.match.updateStatus.useMutation({
    onSuccess: () => {
      utils.match.getMatches.invalidate();
      setConfirmAction(null);
    },
  });

  const allMatches = data?.pages.flatMap((p) => p.matches) ?? [];
  const matches = allMatches.filter((m) => m.store.id === storeId);

  const handleConfirm = () => {
    if (!confirmAction) return;
    updateStatusMutation.mutate({
      matchId: confirmAction.matchId,
      status: confirmAction.type === "accept" ? "ACCEPTED" : "REJECTED",
    });
  };

  const confirmConfig = {
    accept: {
      title: "応募を承認",
      description: (name: string) =>
        `${name}さんの応募を承認しますか？承認後、メッセージのやりとりが可能になります。`,
      variant: "default" as const,
    },
    reject: {
      title: "応募を不採用",
      description: (name: string) =>
        `${name}さんの応募を不採用にしますか？この操作は取り消せません。`,
      variant: "danger" as const,
    },
  };

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-[var(--text-main)] mb-6">
        応募管理
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
      ) : matches.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-100 text-center">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-[var(--text-sub)]">
            {statusFilter
              ? "該当する応募がありません"
              : "まだ応募がありません"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            キャストからの応募がここに表示されます
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {matches.map((match) => {
              const cast = match.cast;
              const photo =
                (cast?.photos as string[] | null)?.[0] ?? null;
              const isPending = match.status === "PENDING";

              return (
                <div
                  key={match.id}
                  className="bg-white rounded-xl border border-gray-100 p-5"
                >
                  <div className="flex gap-4">
                    {/* キャスト画像 */}
                    <div className="flex-shrink-0">
                      {photo ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
                          <img
                            src={photo}
                            alt={cast?.nickname ?? ""}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <Thumbnail
                          src={null}
                          alt={cast?.nickname ?? ""}
                          fallbackType="user"
                          className="!w-16 !h-16"
                        />
                      )}
                    </div>

                    {/* 応募情報 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[var(--text-main)] truncate">
                          {cast?.nickname ?? "不明"}
                        </span>
                        {cast?.age && (
                          <span className="text-sm text-[var(--text-sub)] flex-shrink-0">
                            {cast.age}歳
                          </span>
                        )}
                        {cast?.rank && (
                          <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                            {cast.rank}ランク
                          </span>
                        )}
                        <StatusBadge
                          status={match.status}
                          variant="match"
                        />
                      </div>

                      <p className="text-xs text-[var(--text-sub)] mb-2">
                        応募日:{" "}
                        {new Date(match.createdAt).toLocaleDateString(
                          "ja-JP",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>

                      {/* アクションボタン（審査中のみ） */}
                      {isPending && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() =>
                              setConfirmAction({
                                type: "accept",
                                matchId: match.id,
                                castName: cast?.nickname ?? "不明",
                              })
                            }
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            承認
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() =>
                              setConfirmAction({
                                type: "reject",
                                matchId: match.id,
                                castName: cast?.nickname ?? "不明",
                              })
                            }
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            不採用
                          </Button>
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

      {/* 確認ダイアログ */}
      {confirmAction && (
        <ConfirmDialog
          open={!!confirmAction}
          title={confirmConfig[confirmAction.type].title}
          description={confirmConfig[confirmAction.type].description(
            confirmAction.castName
          )}
          variant={confirmConfig[confirmAction.type].variant}
          confirmLabel="確認"
          cancelLabel="戻る"
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
