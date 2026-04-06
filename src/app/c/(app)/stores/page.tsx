"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppSession } from "@/lib/auth-helpers";
import { Search, SlidersHorizontal } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { trpc } from "@/lib/trpc";
import { TagFilter } from "@/components/cast/TagFilter";
import { StoreCard } from "@/components/cast/StoreCard";
import {
  StoreFilterPanel,
  INITIAL_FILTER_STATE,
  countActiveFilters,
} from "@/components/cast/StoreFilterPanel";
import type { StoreFilterState } from "@/components/cast/StoreFilterPanel";

const FILTER_TAGS = [
  "すべて",
  "未経験歓迎",
  "日払いOK",
  "ドレス貸与",
  "送りあり",
  "高時給",
  "ノルマなし",
];

function formatSalary(salarySystem: unknown): string {
  if (!salarySystem) return "応相談";
  if (typeof salarySystem === "string") return salarySystem;
  const sys = salarySystem as Record<string, number>;
  if (sys.hourlyRateMin) {
    return `時給 ${sys.hourlyRateMin.toLocaleString()}円〜`;
  }
  return "応相談";
}

export default function StoresPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><Spinner /></div>}>
      <StoresContent />
    </Suspense>
  );
}

function StoresContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useAppSession();

  const [selectedTag, setSelectedTag] = useState(searchParams.get("tag") ?? "すべて");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const [filters, setFilters] = useState<StoreFilterState>(INITIAL_FILTER_STATE);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("lumina:onboarding:storesViewed", "true");
  }, []);

  // フィルターパラメータをtRPCクエリ用に構築
  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {};
    if (filters.storeType) params.storeType = filters.storeType;
    if (filters.minSalary) params.minSalary = filters.minSalary;
    if (filters.hasTransportation) params.hasTransportation = true;
    if (filters.hasDressRental) params.hasDressRental = true;
    if (filters.hasDailyPay) params.hasDailyPay = true;
    if (filters.hasNoQuota) params.hasNoQuota = true;
    if (filters.hasDormitory) params.hasDormitory = true;
    if (filters.hasNursery) params.hasNursery = true;
    return params;
  }, [filters]);

  // サーバーサイドフィルタリング（詳細フィルター）
  const { data: storesData, isLoading } = trpc.cast.searchStores.useQuery(queryParams);
  const allStores = storesData?.stores ?? [];

  // クライアントサイドフィルタリング（テキスト検索 + タグフィルター）
  const filteredStores = useMemo(() => {
    return allStores.filter((store) => {
      // キーワード検索（エリア・店舗名）
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchArea = store.area?.toLowerCase().includes(q);
        const matchName = store.name.toLowerCase().includes(q);
        if (!matchArea && !matchName) return false;
      }
      // タグフィルター
      if (selectedTag !== "すべて") {
        const benefits = (store.benefits as string[] | null) ?? [];
        if (!benefits.some((b) => b.includes(selectedTag.replace("OK", "").replace("あり", "")))) {
          return false;
        }
      }
      return true;
    });
  }, [allStores, searchQuery, selectedTag]);

  const activeFilterCount = countActiveFilters(filters);

  const handleSelectTag = (tag: string) => {
    setSelectedTag(tag);
    updateURL(searchQuery, tag);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    updateURL(value, selectedTag);
  };

  const handleApplyFilters = (newFilters: StoreFilterState) => {
    setFilters(newFilters);
  };

  const updateURL = (query: string, tag: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (tag !== "すべて") params.set("tag", tag);
    const qs = params.toString();
    router.replace(`/c/stores${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  if (status === "unauthenticated" || (session && session.user.role !== "CAST")) {
    router.push("/c/login");
    return null;
  }

  if (status === "loading" || isLoading || !session || session.user.role !== "CAST") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 bg-(--bg-gray) pt-2 pb-3 -mx-4 px-4 z-10">
        <div className="flex gap-2.5 mb-4">
          <div className="flex-1 bg-gray-100 rounded-xl px-4 py-3 flex items-center gap-2.5">
            <Search className="w-5 h-5 text-(--text-sub)" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="エリア、キーワードで検索..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-(--text-sub)"
            />
          </div>
          <button
            onClick={() => setIsFilterOpen(true)}
            className="relative w-12 h-12 bg-(--primary-bg) rounded-xl flex items-center justify-center"
          >
            <SlidersHorizontal className="w-5 h-5 text-(--primary)" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-(--primary) text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <TagFilter
          tags={FILTER_TAGS}
          selectedTag={selectedTag}
          onSelectTag={handleSelectTag}
        />
      </div>

      <div className="space-y-4 pb-4">
        {filteredStores.length === 0 ? (
          <EmptyState icon={Search} title="該当する店舗が見つかりませんでした" />
        ) : (
          filteredStores.map((store) => {
            const featureTags: string[] = [];
            if (store.hasQuota === false) featureTags.push("ノルマなし");
            if (store.hasTransportation) featureTags.push("送迎あり");
            if (store.hasDormitory) featureTags.push("寮完備");
            if (store.dailyPayType === "FULL") featureTags.push("全額日払い");
            else if (store.dailyPayType === "PARTIAL") featureTags.push("日払いあり");
            if (store.drinkingRequired === false) featureTags.push("飲酒不要");

            return (
              <StoreCard
                key={store.id}
                id={store.id}
                name={store.name}
                area={store.area ?? ""}
                salary={formatSalary(store.salarySystem)}
                imageUrl={store.bannerUrl ?? (store.photos as string[] | null)?.[0] ?? "/service-scene-05.png"}
                logoUrl={store.logoUrl ?? undefined}
                tags={(store.benefits as string[] | null) ?? []}
                storeType={store.storeType}
                nearestStation={store.nearestStation}
                walkMinutes={store.walkMinutes}
                featureTags={featureTags}
                variant="horizontal"
              />
            );
          })
        )}
      </div>

      <StoreFilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApply={handleApplyFilters}
        resultCount={filteredStores.length}
      />
    </div>
  );
}
