"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";

const TABS = ["すべて", "キャバクラ", "クラブ", "ラウンジ", "ガールズバー"] as const;

type Tab = (typeof TABS)[number];

const PICKUP_STORES = [
  {
    id: "1",
    name: "Club VENUS - 銀座本店",
    prefecture: "東京都",
    area: "銀座（錦三）",
    access: "銀座駅 徒歩3分",
    storeType: "キャバクラ" as const,
    tags: ["日払いOK"],
    hourlyRate: 8000,
    backRate: 60,
    image: "/champagne-night-view.png",
  },
  {
    id: "2",
    name: "Lounge Royal - 六本木",
    prefecture: "東京都",
    area: "六本木",
    access: "六本木駅 徒歩1分",
    storeType: "ラウンジ" as const,
    tags: ["高時給", "未経験歓迎"],
    hourlyRate: 6000,
    backRate: 50,
    image: "/champagne-night-view.png",
  },
  {
    id: "3",
    name: "Night Garden - 新宿",
    prefecture: "東京都",
    area: "新宿・歌舞伎町",
    access: "新宿駅 徒歩5分",
    storeType: "キャバクラ" as const,
    tags: ["週1OK", "送迎あり"],
    hourlyRate: 5000,
    backRate: 45,
    image: "/champagne-night-view.png",
  },
  {
    id: "4",
    name: "銀座 First Lounge（サンプル）",
    prefecture: "東京都",
    area: "銀座",
    access: "銀座一丁目 徒歩4分",
    storeType: "クラブ" as const,
    tags: ["高時給"],
    hourlyRate: 12000,
    backRate: 55,
    image: "/champagne-night-view.png",
  },
];

export function PickupStores() {
  const [tab, setTab] = useState<Tab>("すべて");

  const filtered = useMemo(() => {
    if (tab === "すべて") return PICKUP_STORES;
    return PICKUP_STORES.filter((s) => s.storeType === tab);
  }, [tab]);

  return (
    <section className="border-t border-stone-100 bg-stone-50 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-rose-500">掲載店舗</p>
          <h2 className="mt-2 text-2xl font-bold text-stone-900 md:text-4xl">
            掲載されているお店を一部紹介
          </h2>
          <p className="mt-3 text-sm text-stone-600">
            実際の検索では、エリアや条件でさらに絞り込めます（掲載例・デザインイメージ）。
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                tab === t
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/25"
                  : "border border-stone-200 bg-white text-stone-600 hover:border-rose-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((store) => (
            <li
              key={store.id}
              className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="relative h-44">
                <Image src={store.image} alt={store.name} fill className="object-cover" />
                <div className="absolute bottom-2 left-2 flex flex-wrap gap-1.5">
                  <span className="rounded bg-black/65 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                    {store.storeType}
                  </span>
                  {store.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-black/65 px-2 py-0.5 text-xs text-white backdrop-blur-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-stone-900">{store.name}</h3>
                <ul className="mt-2 space-y-0.5 text-sm text-stone-600">
                  <li className="flex items-center gap-1">
                    <span className="text-stone-400">{store.prefecture}</span>
                  </li>
                  <li className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-rose-400" aria-hidden />
                    {store.area}
                  </li>
                  <li className="text-xs text-stone-500">{store.access}</li>
                </ul>
                <p className="mt-4 text-xs text-stone-500">時給（目安・サンプル）</p>
                <p className="text-xl font-bold text-rose-500">
                  {store.hourlyRate.toLocaleString("ja-JP")}円〜
                </p>
                <p className="mt-1 text-xs text-stone-500">本指名バック 最大{store.backRate}%（例）</p>
              </div>
            </li>
          ))}
        </ul>

        {filtered.length === 0 && (
          <p className="mt-10 text-center text-sm text-stone-500">このカテゴリのサンプルは準備中です。</p>
        )}

        <div className="mx-auto mt-12 max-w-lg">
          <Link
            href="/diagnosis"
            className="flex w-full items-center justify-between rounded-2xl bg-rose-500 px-6 py-4 font-bold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-600"
          >
            <span>診断して、あなたに合う店舗を探す</span>
            <svg className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
