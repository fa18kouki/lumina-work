"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { trpc } from "@/lib/trpc";

const TABS = ["すべて", "キャバクラ", "クラブ", "ラウンジ", "ガールズバー", "その他"] as const;

type Tab = (typeof TABS)[number];

type PublicStore = {
  id: string;
  name: string;
  area: string;
  description: string | null;
  photos: string[];
  bannerUrl: string | null;
  logoUrl: string | null;
  storeType: "CABARET" | "CLUB" | "LOUNGE" | "GIRLS_BAR" | "SNACK" | "OTHER" | null;
  nearestStation: string | null;
  walkMinutes: number | null;
  salarySystem: unknown;
  benefits: string[];
  businessHours: string | null;
  regularHolidays: string | null;
  hasTransportation: boolean;
  hasDormitory: boolean;
  hasDressRental: boolean;
  hasHairMakeup: boolean;
  hasQuota: boolean;
  drinkingRequired: boolean;
  dailyPayType: "NONE" | "PARTIAL" | "FULL";
  hasNursery: boolean;
  atmosphereTags: string[];
  signingBonus: number | null;
  trialShiftInfo: unknown;
};

type PickupStoreCard = {
  id: string;
  name: string;
  area: string;
  access: string;
  storeType: string;
  tab: Exclude<Tab, "すべて">;
  tags: string[];
  hourlyRate: number | null;
  image: string;
};

const STORE_TYPE_LABELS: Record<NonNullable<PublicStore["storeType"]>, Exclude<Tab, "すべて">> = {
  CABARET: "キャバクラ",
  CLUB: "クラブ",
  LOUNGE: "ラウンジ",
  GIRLS_BAR: "ガールズバー",
  SNACK: "その他",
  OTHER: "その他",
};

function getHourlyRateMin(salarySystem: unknown): number | null {
  if (!salarySystem || typeof salarySystem !== "object") return null;
  const value = (salarySystem as { hourlyRateMin?: unknown }).hourlyRateMin;
  return typeof value === "number" ? value : null;
}

export function toPickupStoreCardModel(store: PublicStore): PickupStoreCard {
  const tab = store.storeType ? STORE_TYPE_LABELS[store.storeType] : "その他";
  const access = store.nearestStation
    ? `${store.nearestStation}${store.walkMinutes ? ` 徒歩${store.walkMinutes}分` : ""}`
    : store.area;

  return {
    id: store.id,
    name: store.name,
    area: store.area,
    access,
    storeType: store.storeType ? STORE_TYPE_LABELS[store.storeType] : "掲載店舗",
    tab,
    tags: [...(store.benefits ?? []), ...(store.atmosphereTags ?? [])].filter(Boolean).slice(0, 2),
    hourlyRate: getHourlyRateMin(store.salarySystem),
    image: store.bannerUrl ?? store.photos?.[0] ?? "/champagne-night-view.png",
  };
}

export function PickupStores() {
  const [tab, setTab] = useState<Tab>("すべて");
  const { data: publicStores = [], isLoading, isError } = trpc.store.getPublicList.useQuery();

  const stores = useMemo(
    () => publicStores.map((store) => toPickupStoreCardModel(store)).slice(0, 6),
    [publicStores],
  );

  const filtered = useMemo(() => {
    if (tab === "すべて") return stores;
    return stores.filter((s) => s.tab === tab);
  }, [stores, tab]);

  return (
    <section className="border-t border-stone-100 bg-stone-50 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-pink-500">新着店舗</p>
          <h2 className="mt-2 text-2xl font-bold text-stone-900 md:text-4xl">
            掲載されたばかりのお店をチェック
          </h2>
          <p className="mt-3 text-sm text-stone-600">
            管理側で審査済みの店舗だけを、新着順に一部掲載しています。
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
                  ? "bg-pink-500 text-white shadow-md shadow-pink-500/25"
                  : "border border-stone-200 bg-white text-stone-600 hover:border-pink-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {isLoading ? (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <li key={index} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                <div className="h-44 animate-pulse bg-stone-200" />
                <div className="space-y-3 p-4">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-stone-200" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-stone-100" />
                  <div className="h-7 w-1/3 animate-pulse rounded bg-stone-100" />
                </div>
              </li>
            ))}
          </ul>
        ) : isError ? (
          <p className="mt-10 text-center text-sm text-stone-500">
            新着店舗の読み込みに失敗しました。時間をおいて再度お試しください。
          </p>
        ) : filtered.length > 0 ? (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((store) => (
              <li
                key={store.id}
                className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="relative h-44">
                  <Image src={store.image} alt={store.name} fill className="object-cover" />
                  <div className="absolute left-2 top-2 rounded-full bg-pink-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                    NEW
                  </div>
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
                      <span className="text-stone-400">{store.area}</span>
                    </li>
                    <li className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-pink-400" aria-hidden />
                      {store.access}
                    </li>
                  </ul>
                  <p className="mt-4 text-xs text-stone-500">時給目安</p>
                  <p className="text-xl font-bold text-pink-500">
                    {store.hourlyRate ? `${store.hourlyRate.toLocaleString("ja-JP")}円〜` : "応相談"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-10 text-center text-sm text-stone-500">
            現在、このカテゴリで公開中の新着店舗はありません。
          </p>
        )}

        <div className="mx-auto mt-12 max-w-lg">
          <Link
            href="/diagnosis"
            className="flex w-full items-center justify-between rounded-2xl bg-pink-500 px-6 py-4 font-bold text-white shadow-lg shadow-pink-500/30 transition hover:bg-pink-600"
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
