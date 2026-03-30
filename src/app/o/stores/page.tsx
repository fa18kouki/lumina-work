"use client";

import Link from "next/link";
import { Store, Plus, FileText, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function OwnerStoresPage() {
  const { data: stores, isLoading } = trpc.owner.listStores.useQuery();
  const { data: storeCount } = trpc.owner.getStoreCount.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[var(--text-sub)]">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-main)]">
            店舗一覧
          </h1>
          {storeCount && (
            <p className="text-sm text-[var(--text-sub)] mt-1">
              {storeCount.current}店舗
              {storeCount.max ? ` / ${storeCount.max}店舗まで` : ""}
            </p>
          )}
        </div>
        <Link
          href="/o/stores/new"
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          店舗を追加
        </Link>
      </div>

      {!stores || stores.length === 0 ? (
        <div className="bg-white rounded-xl p-8 border border-gray-100 text-center">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-[var(--text-sub)] mb-4">
            まだ店舗が登録されていません
          </p>
          <Link
            href="/o/stores/new"
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            最初の店舗を追加
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((store) => (
            <Link
              key={store.id}
              href={`/o/stores/${store.id}`}
              className="bg-white rounded-xl p-5 border border-gray-100 hover:border-gray-300 transition-colors group"
            >
              {store.photos[0] && (
                <div className="w-full h-32 rounded-lg bg-gray-100 mb-3 overflow-hidden">
                  <img
                    src={store.photos[0]}
                    alt={store.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-[var(--text-main)] group-hover:text-slate-700">
                    {store.name}
                  </h3>
                  <p className="text-sm text-[var(--text-sub)]">
                    {store.area} · {store.address}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-[var(--text-sub)]">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  {store._count.offers}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {store._count.interviews}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
