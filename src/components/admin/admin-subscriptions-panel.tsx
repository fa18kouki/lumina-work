"use client";

import { useEffect, useState } from "react";

import { AdminSubscriptionList } from "./admin-subscription-list";

export function AdminSubscriptionsPanel() {
  const [rawSearch, setRawSearch] = useState("");
  const [search, setSearch] = useState("");

  // 検索 debounce 300ms — タイプ毎に Prisma クエリを撃たないため
  useEffect(() => {
    const handle = setTimeout(() => setSearch(rawSearch.trim()), 300);
    return () => clearTimeout(handle);
  }, [rawSearch]);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">プラン管理</h2>
        <p className="text-sm text-slate-600">
          有料プランの契約は本人確認が必要なため自動化していません。
          問い合わせ・本人確認が完了したオーナーに対し、この画面から
          手動でプランを設定してください。
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span className="sr-only">検索</span>
          <input
            type="search"
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
            placeholder="email で検索"
            className="w-64 rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </label>
      </div>

      <AdminSubscriptionList search={search.length > 0 ? search : undefined} />
    </section>
  );
}
