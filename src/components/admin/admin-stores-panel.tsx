"use client";

import { useEffect, useState } from "react";

import { AdminStoreList } from "./admin-store-list";

type VerifiedFilter = "ALL" | "VERIFIED" | "UNVERIFIED";

const FILTER_OPTIONS: { value: VerifiedFilter; label: string }[] = [
  { value: "ALL", label: "すべて" },
  { value: "VERIFIED", label: "認証済み" },
  { value: "UNVERIFIED", label: "未認証" },
];

export function AdminStoresPanel() {
  const [verified, setVerified] = useState<VerifiedFilter>("ALL");
  const [rawSearch, setRawSearch] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => setSearch(rawSearch.trim()), 300);
    return () => clearTimeout(handle);
  }, [rawSearch]);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">店舗 / オーナー一覧</h2>
        <p className="text-sm text-slate-600">
          認証状態でフィルタし、オーナーと案件数を 1 行で確認できます。
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setVerified(opt.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                verified === opt.value
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span className="sr-only">店舗名検索</span>
          <input
            type="search"
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
            placeholder="店舗名で検索"
            className="w-64 rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </label>
      </div>

      <AdminStoreList
        isVerified={
          verified === "ALL" ? undefined : verified === "VERIFIED"
        }
        search={search.length > 0 ? search : undefined}
      />
    </section>
  );
}
