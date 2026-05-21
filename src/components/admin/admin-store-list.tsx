"use client";

import { useEffect, useState } from "react";

import { trpc } from "@/lib/trpc";

import { formatDate } from "./format";

interface AdminStoreListProps {
  isVerified?: boolean;
  search?: string;
}

export function AdminStoreList({ isVerified, search }: AdminStoreListProps) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  useEffect(() => {
    setCursor(undefined);
  }, [isVerified, search]);

  const query = trpc.adminPanel.stores.list.useQuery(
    { isVerified, search, cursor, limit: 50 },
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

  const { stores, nextCursor } = query.data ?? { stores: [], nextCursor: null };

  if (stores.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        該当する店舗はありません
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
                店舗名
              </th>
              <th scope="col" className="px-4 py-3">
                エリア
              </th>
              <th scope="col" className="px-4 py-3">
                認証
              </th>
              <th scope="col" className="px-4 py-3">
                オーナー
              </th>
              <th scope="col" className="px-4 py-3">
                マッチ/オファー/面接
              </th>
              <th scope="col" className="px-4 py-3">
                登録日時
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stores.map((s) => (
              <tr key={s.id} className="text-slate-700">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {s.name}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">{s.area}</td>
                <td className="px-4 py-3">
                  {s.isVerified ? (
                    <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      認証済み
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      未認証
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  <div className="font-medium text-slate-900">
                    {s.owner.companyName ?? "(会社名未登録)"}
                  </div>
                  <div className="text-slate-500">
                    {s.owner.user?.email ?? "-"}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {s._count.matches} / {s._count.offers} / {s._count.interviews}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {formatDate(s.createdAt)}
                </td>
              </tr>
            ))}
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
    </div>
  );
}
