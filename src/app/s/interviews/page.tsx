"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, Clock, FileText } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { TabFilter } from "@/components/ui/tab-filter";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Thumbnail } from "@/components/ui/thumbnail";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useStoreSession } from "@/lib/auth-helpers";
import { trpc } from "@/lib/trpc";
import { type InterviewStatus } from "@prisma/client";

const TABS = [
  { value: "ALL", label: "すべて" },
  { value: "SCHEDULED", label: "予定" },
  { value: "COMPLETED", label: "完了" },
  { value: "NO_SHOW", label: "無断欠席" },
  { value: "CANCELLED", label: "キャンセル" },
];

type ConfirmAction = {
  type: "complete" | "noshow" | "cancel";
  interviewId: string;
  castName: string;
};

export default function StoreInterviewsPage() {
  const router = useRouter();
  const { user, status } = useStoreSession();
  const [activeTab, setActiveTab] = useState("ALL");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null
  );

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.interview.getInterviews.useQuery({});

  const completeMutation = trpc.interview.complete.useMutation({
    onSuccess: () => utils.interview.getInterviews.invalidate(),
  });
  const noShowMutation = trpc.interview.reportNoShow.useMutation({
    onSuccess: () => utils.interview.getInterviews.invalidate(),
  });
  const cancelMutation = trpc.interview.cancel.useMutation({
    onSuccess: () => utils.interview.getInterviews.invalidate(),
  });

  const handleConfirm = useCallback(() => {
    if (!confirmAction) return;

    switch (confirmAction.type) {
      case "complete":
        completeMutation.mutate({ interviewId: confirmAction.interviewId });
        break;
      case "noshow":
        noShowMutation.mutate({ interviewId: confirmAction.interviewId });
        break;
      case "cancel":
        cancelMutation.mutate({ interviewId: confirmAction.interviewId });
        break;
    }
    setConfirmAction(null);
  }, [confirmAction, completeMutation, noShowMutation, cancelMutation]);

  if (status === "loading" || isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  const interviews = data?.interviews ?? [];

  const filtered =
    activeTab === "ALL"
      ? interviews
      : interviews.filter((iv) => iv.status === activeTab);

  const confirmConfig: Record<
    ConfirmAction["type"],
    { title: string; description: string; confirmLabel: string; variant: "default" | "danger" }
  > = {
    complete: {
      title: "面接を完了にしますか？",
      description: `${confirmAction?.castName ?? ""}さんの面接を完了済みにします。`,
      confirmLabel: "完了にする",
      variant: "default",
    },
    noshow: {
      title: "無断欠席を報告しますか？",
      description: `${confirmAction?.castName ?? ""}さんが面接に無断で欠席したことを報告します。キャストにペナルティが付与されます。`,
      confirmLabel: "報告する",
      variant: "danger",
    },
    cancel: {
      title: "面接をキャンセルしますか？",
      description: `${confirmAction?.castName ?? ""}さんとの面接をキャンセルします。この操作は取り消せません。`,
      confirmLabel: "キャンセルする",
      variant: "danger",
    },
  };

  const currentConfig = confirmAction
    ? confirmConfig[confirmAction.type]
    : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-(--text-main)">面接管理</h1>

      <TabFilter
        tabs={TABS}
        activeValue={activeTab}
        onChange={setActiveTab}
        variant="pill"
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="面接予定はありません"
          description={
            activeTab === "ALL"
              ? "オファーが承諾されると面接予定が作成されます"
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((interview) => (
            <div
              key={interview.id}
              className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <Thumbnail
                  src={interview.cast?.photos?.[0]}
                  alt={interview.cast?.nickname ?? "キャスト"}
                  size="sm"
                  shape="square"
                  fallbackType="user"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-(--text-main) text-sm">
                      {interview.cast?.nickname ?? "キャスト"}
                    </span>
                    <StatusBadge
                      status={interview.status}
                      variant="interview"
                    />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-(--text-sub) mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {new Date(interview.scheduledAt).toLocaleDateString(
                        "ja-JP",
                        {
                          month: "long",
                          day: "numeric",
                          weekday: "short",
                        }
                      )}{" "}
                      {new Date(interview.scheduledAt).toLocaleTimeString(
                        "ja-JP",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>
                  {interview.notes && (
                    <div className="flex items-start gap-1 text-xs text-(--text-sub)">
                      <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{interview.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {interview.status === "SCHEDULED" && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() =>
                      setConfirmAction({
                        type: "complete",
                        interviewId: interview.id,
                        castName: interview.cast?.nickname ?? "キャスト",
                      })
                    }
                    className="flex-1 px-3 py-2 rounded-md text-xs font-medium bg-slate-800 text-white hover:bg-slate-900 transition-colors"
                  >
                    完了にする
                  </button>
                  <button
                    onClick={() =>
                      setConfirmAction({
                        type: "noshow",
                        interviewId: interview.id,
                        castName: interview.cast?.nickname ?? "キャスト",
                      })
                    }
                    className="flex-1 px-3 py-2 rounded-md text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    無断欠席
                  </button>
                  <button
                    onClick={() =>
                      setConfirmAction({
                        type: "cancel",
                        interviewId: interview.id,
                        castName: interview.cast?.nickname ?? "キャスト",
                      })
                    }
                    className="flex-1 px-3 py-2 rounded-md text-xs font-medium bg-gray-100 text-(--text-sub) hover:bg-gray-200 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {currentConfig && (
        <ConfirmDialog
          open={!!confirmAction}
          title={currentConfig.title}
          description={currentConfig.description}
          confirmLabel={currentConfig.confirmLabel}
          variant={currentConfig.variant}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
