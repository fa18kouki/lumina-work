"use client";

import { useEffect, useState } from "react";

import { trpc } from "@/lib/trpc";

import { AdminSubscriptionEditModal } from "./admin-subscription-edit-modal";
import { formatDate } from "./format";

interface AdminSubscriptionListProps {
  search?: string;
}

const PLAN_LABEL: Record<string, string> = {
  FREE: "フリー",
  CASUAL: "カジュアル",
  PRO_TRIAL: "プロ",
  PRO_BUSINESS: "プロ ビジネス",
  PRO_ENTERPRISE: "プロ エンタープライズ",
};

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PAST_DUE: "bg-amber-100 text-amber-800",
  CANCELLED: "bg-slate-200 text-slate-600",
  INCOMPLETE: "bg-rose-100 text-rose-700",
};

type EditTarget = {
  userId: string;
  email: string | null;
  companyName: string | null;
  currentPlan: string;
  currentStatus: string;
  offerLimit: number | null;
  maxStores: number | null;
  customMonthlyPriceJpy: number | null;
};

export function AdminSubscriptionList({ search }: AdminSubscriptionListProps) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  useEffect(() => {
    setCursor(undefined);
  }, [search]);

  const query = trpc.adminPanel.subscriptions.list.useQuery(
    { search, cursor, limit: 50 },
    { staleTime: 15_000 },
  );

  if (query.isLoading) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        読み込み中...
      </div>
    );
  }

  if (query.error) {
    return (
      <div
        className="rounded-md border border-red-200 bg-red-50 p-6 text-sm text-red-700"
        role="alert"
      >
        一覧の取得に失敗しました: {query.error.message}
      </div>
    );
  }

  const { users, nextCursor } = query.data ?? { users: [], nextCursor: null };

  if (users.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        該当するオーナーはいません
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3">
                email
              </th>
              <th scope="col" className="px-4 py-3">
                会社名
              </th>
              <th scope="col" className="px-4 py-3">
                現在のプラン
              </th>
              <th scope="col" className="px-4 py-3">
                status
              </th>
              <th scope="col" className="px-4 py-3">
                個別月額
              </th>
              <th scope="col" className="px-4 py-3">
                登録日時
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => {
              const subscription = u.owner?.subscription;
              const plan = subscription?.plan ?? "FREE";
              const status = subscription?.status ?? "ACTIVE";
              return (
                <tr key={u.id} className="text-slate-700">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {u.email ?? <span className="text-slate-400">-</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {u.owner?.companyName ?? (
                      <span className="text-slate-400">(未登録)</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                      {PLAN_LABEL[plan] ?? plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_STYLE[status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700">
                    {subscription?.customMonthlyPriceJpy != null ? (
                      `¥${subscription.customMonthlyPriceJpy.toLocaleString()}`
                    ) : (
                      <span className="text-slate-400">標準価格</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setEditTarget({
                          userId: u.id,
                          email: u.email ?? null,
                          companyName: u.owner?.companyName ?? null,
                          currentPlan: plan,
                          currentStatus: status,
                          offerLimit: subscription?.offerLimit ?? null,
                          maxStores: subscription?.maxStores ?? null,
                          customMonthlyPriceJpy:
                            subscription?.customMonthlyPriceJpy ?? null,
                        })
                      }
                      className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      プラン変更
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!nextCursor}
          onClick={() => nextCursor && setCursor(nextCursor)}
          className="rounded-md bg-slate-900 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          次のページ
        </button>
      </div>

      {editTarget ? (
        <AdminSubscriptionEditModal
          target={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            query.refetch();
          }}
        />
      ) : null}
    </div>
  );
}
