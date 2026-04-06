"use client";

import { use, useState } from "react";
import {
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { StatusBadge } from "@/components/ui/status-badge";
import { Thumbnail } from "@/components/ui/thumbnail";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type InterviewStatus = "SCHEDULED" | "COMPLETED" | "NO_SHOW" | "CANCELLED";

const STATUS_TABS = [
  { value: "", label: "すべて" },
  { value: "SCHEDULED", label: "予定" },
  { value: "COMPLETED", label: "完了" },
  { value: "CANCELLED", label: "キャンセル" },
  { value: "NO_SHOW", label: "無断欠席" },
] as const;

export default function StoreInterviewsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = use(params);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [confirmAction, setConfirmAction] = useState<{
    type: "complete" | "cancel" | "noShow";
    interviewId: string;
  } | null>(null);

  const utils = trpc.useUtils();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.interview.getInterviews.useInfiniteQuery(
      {
        limit: 20,
        ...(statusFilter && { status: statusFilter as InterviewStatus }),
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        initialCursor: undefined,
      }
    );

  const completeMutation = trpc.interview.complete.useMutation({
    onSuccess: () => {
      utils.interview.getInterviews.invalidate();
      setConfirmAction(null);
    },
  });

  const cancelMutation = trpc.interview.cancel.useMutation({
    onSuccess: () => {
      utils.interview.getInterviews.invalidate();
      setConfirmAction(null);
    },
  });

  const noShowMutation = trpc.interview.reportNoShow.useMutation({
    onSuccess: () => {
      utils.interview.getInterviews.invalidate();
      setConfirmAction(null);
    },
  });

  const allInterviews = data?.pages.flatMap((p) => p.interviews) ?? [];

  // この店舗の面接のみフィルタ
  const interviews = allInterviews.filter((i) => i.store.id === storeId);

  const handleConfirm = () => {
    if (!confirmAction) return;

    switch (confirmAction.type) {
      case "complete":
        completeMutation.mutate({ interviewId: confirmAction.interviewId });
        break;
      case "cancel":
        cancelMutation.mutate({ interviewId: confirmAction.interviewId });
        break;
      case "noShow":
        noShowMutation.mutate({ interviewId: confirmAction.interviewId });
        break;
    }
  };

  const confirmConfig = {
    complete: {
      title: "面接完了",
      description: "この面接を完了にしますか？",
      variant: "default" as const,
    },
    cancel: {
      title: "面接キャンセル",
      description: "この面接をキャンセルしますか？",
      variant: "danger" as const,
    },
    noShow: {
      title: "無断欠席報告",
      description:
        "無断欠席として報告しますか？キャストにペナルティが課されます。",
      variant: "danger" as const,
    },
  };

  const isPending =
    completeMutation.isPending ||
    cancelMutation.isPending ||
    noShowMutation.isPending;

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-[var(--text-main)] mb-6">
        面接管理
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
      ) : interviews.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-100 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-[var(--text-sub)]">
            {statusFilter
              ? "該当する面接がありません"
              : "まだ面接の予定がありません"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            オファーが承諾されると、面接を設定できます
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {interviews.map((interview) => {
              const cast = interview.cast;
              const photo = cast?.photos?.[0] ?? null;
              const isScheduled = interview.status === "SCHEDULED";
              const scheduledDate = new Date(interview.scheduledAt);

              return (
                <div
                  key={interview.id}
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

                    {/* 面接情報 */}
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
                        <StatusBadge
                          status={interview.status}
                          variant="interview"
                        />
                      </div>

                      <div className="flex items-center gap-1 text-sm text-[var(--text-sub)] mb-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {scheduledDate.toLocaleDateString("ja-JP", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                          {" "}
                          {scheduledDate.toLocaleTimeString("ja-JP", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* アクションボタン（予定中のみ） */}
                      {isScheduled && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() =>
                              setConfirmAction({
                                type: "complete",
                                interviewId: interview.id,
                              })
                            }
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            完了
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setConfirmAction({
                                type: "cancel",
                                interviewId: interview.id,
                              })
                            }
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            キャンセル
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() =>
                              setConfirmAction({
                                type: "noShow",
                                interviewId: interview.id,
                              })
                            }
                          >
                            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                            無断欠席
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
          description={confirmConfig[confirmAction.type].description}
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
