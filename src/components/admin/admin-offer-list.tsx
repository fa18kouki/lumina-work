"use client";

import { useEffect, useState } from "react";

import { trpc } from "@/lib/trpc";

import { AdminOfferRow } from "./admin-offer-row";

interface AdminOfferListProps {
  status?: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
}

export function AdminOfferList({ status }: AdminOfferListProps) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  useEffect(() => {
    setCursor(undefined);
  }, [status]);

  const query = trpc.adminPanel.offers.list.useQuery(
    { status, cursor, limit: 50 },
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

  const { offers, nextCursor } = query.data ?? { offers: [], nextCursor: null };

  if (offers.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        該当するオファーはありません
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
                キャスト
              </th>
              <th scope="col" className="px-4 py-3">
                店舗
              </th>
              <th scope="col" className="px-4 py-3">
                状態
              </th>
              <th scope="col" className="px-4 py-3">
                送信日時
              </th>
              <th scope="col" className="px-4 py-3">
                期限
              </th>
              <th scope="col" className="px-4 py-3">
                面接
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {offers.map((offer) => (
              <AdminOfferRow key={offer.id} offer={offer} />
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
