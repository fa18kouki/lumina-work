"use client";

import { Download, FileText, RefreshCw, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<string, { label: string; style: string }> = {
  paid: { label: "支払済", style: "bg-green-100 text-green-700" },
  open: { label: "未払い", style: "bg-yellow-100 text-yellow-700" },
  void: { label: "無効", style: "bg-gray-100 text-gray-500" },
  uncollectible: { label: "回収不能", style: "bg-red-100 text-red-700" },
};

export default function BillingPage() {
  const { data: subscription } = trpc.subscription.getSubscription.useQuery();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.subscription.listInvoices.useInfiniteQuery(
      { limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined }
    );
  const syncMutation = trpc.subscription.syncInvoices.useMutation({
    onSuccess: () => {
      utils.subscription.listInvoices.invalidate();
    },
  });
  const utils = trpc.useUtils();

  const allInvoices = data?.pages.flatMap((p) => p.invoices) ?? [];
  const hasSubscription = subscription && "stripeCustomerId" in subscription && subscription.stripeCustomerId;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-main)]">
          請求・履歴
        </h1>
        {hasSubscription && (
          <Button
            variant="outline"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            {syncMutation.isPending ? "同期中..." : "Stripeと同期"}
          </Button>
        )}
      </div>

      {/* 次回請求日 */}
      {subscription && "currentPeriodEnd" in subscription && subscription.currentPeriodEnd && (
        <div className="bg-white rounded-xl p-5 border border-gray-100 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-sub)] mb-1">次回請求日</p>
              <p className="text-lg font-bold text-[var(--text-main)]">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-sub)] mb-1">現在のプラン</p>
              <p className="font-medium text-[var(--text-main)]">
                {subscription.plan === "FREE" && "フリー"}
                {subscription.plan === "CASUAL" && "カジュアル"}
                {subscription.plan === "PRO_TRIAL" && "プロ"}
                {subscription.plan === "PRO_BUSINESS" && "プロ ビジネス"}
                {subscription.plan === "PRO_ENTERPRISE" && "プロ エンタープライズ"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 請求書一覧 */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-[var(--text-sub)]">読み込み中...</div>
        </div>
      ) : allInvoices.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-100 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-[var(--text-sub)] mb-2">
            請求履歴がありません
          </p>
          {hasSubscription && (
            <p className="text-xs text-[var(--text-sub)]">
              「Stripeと同期」ボタンで過去の請求書を取得できます
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* テーブルヘッダー */}
            <div className="hidden sm:grid sm:grid-cols-[1fr_120px_120px_100px_80px] gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50/50">
              <span className="text-xs font-medium text-[var(--text-sub)]">請求書番号</span>
              <span className="text-xs font-medium text-[var(--text-sub)]">請求日</span>
              <span className="text-xs font-medium text-[var(--text-sub)] text-right">金額</span>
              <span className="text-xs font-medium text-[var(--text-sub)] text-center">ステータス</span>
              <span className="text-xs font-medium text-[var(--text-sub)] text-center">PDF</span>
            </div>

            {/* テーブル行 */}
            {allInvoices.map((invoice) => {
              const statusInfo = STATUS_LABELS[invoice.status] ?? { label: invoice.status, style: "bg-gray-100 text-gray-500" };
              return (
                <div
                  key={invoice.id}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_100px_80px] gap-2 sm:gap-4 px-5 py-4 border-b border-gray-50 last:border-b-0 items-center"
                >
                  <div>
                    <span className="text-sm font-medium text-[var(--text-main)]">
                      {invoice.number ?? invoice.stripeInvoiceId.slice(0, 12)}
                    </span>
                    <span className="sm:hidden text-xs text-[var(--text-sub)] ml-2">
                      {new Date(invoice.createdAt).toLocaleDateString("ja-JP")}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm text-[var(--text-sub)]">
                    {new Date(invoice.createdAt).toLocaleDateString("ja-JP")}
                  </span>
                  <span className="text-sm font-medium text-[var(--text-main)] sm:text-right">
                    ¥{invoice.amountPaid.toLocaleString()}
                  </span>
                  <div className="sm:text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-xl text-xs font-medium ${statusInfo.style}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="sm:text-center">
                    {invoice.invoicePdfUrl ? (
                      <a
                        href={invoice.invoicePdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span className="sm:hidden">PDF</span>
                      </a>
                    ) : invoice.hostedInvoiceUrl ? (
                      <a
                        href={invoice.hostedInvoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="sm:hidden">詳細</span>
                      </a>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
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
    </div>
  );
}
