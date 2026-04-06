"use client";

import { use, useState, useCallback } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { CastCard } from "@/components/store/cast-card";
import { CastDetailModal } from "@/components/store/cast-detail-modal";
import { SendOfferDialog } from "@/components/store/send-offer-dialog";
import { AreaSelect } from "@/components/ui/area-select";
import { Button } from "@/components/ui/button";

interface Filters {
  area: string;
  minAge: number | undefined;
  maxAge: number | undefined;
  rank: "C" | "B" | "A" | "S" | undefined;
  minExperience: number | undefined;
}

const RANK_OPTIONS = [
  { value: "", label: "全て" },
  { value: "S", label: "S" },
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
] as const;

export default function StoreCastsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = use(params);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    area: "",
    minAge: undefined,
    maxAge: undefined,
    rank: undefined,
    minExperience: undefined,
  });

  // 詳細モーダル
  const [detailCastId, setDetailCastId] = useState<string | null>(null);
  // オファーダイアログ
  const [offerTarget, setOfferTarget] = useState<{ id: string; nickname: string } | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.store.searchCasts.useInfiniteQuery(
      {
        storeId,
        limit: 20,
        ...(filters.area && { area: filters.area }),
        ...(filters.minAge && { minAge: filters.minAge }),
        ...(filters.maxAge && { maxAge: filters.maxAge }),
        ...(filters.rank && { rank: filters.rank }),
        ...(filters.minExperience != null && { minExperience: filters.minExperience }),
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      }
    );

  const utils = trpc.useUtils();
  const allCasts = data?.pages.flatMap((p) => p.casts) ?? [];
  const detailCastRaw = detailCastId ? allCasts.find((c) => c.id === detailCastId) ?? null : null;
  // searchCasts の返却型を CastDetailModal が受け付ける型に変換
  const detailCast = detailCastRaw as Parameters<typeof CastDetailModal>[0]["cast"];

  const handleOfferFromDetail = useCallback((castId: string) => {
    const cast = allCasts.find((c) => c.id === castId);
    if (cast) {
      setDetailCastId(null);
      setOfferTarget({ id: cast.id, nickname: cast.nickname });
    }
  }, [allCasts]);

  const handleOfferFromCard = useCallback((castId: string) => {
    const cast = allCasts.find((c) => c.id === castId);
    if (cast) {
      setOfferTarget({ id: cast.id, nickname: cast.nickname });
    }
  }, [allCasts]);

  const handleOfferSuccess = useCallback(() => {
    setOfferTarget(null);
    utils.store.searchCasts.invalidate({ storeId });
  }, [utils, storeId]);

  const clearFilters = () => {
    setFilters({
      area: "",
      minAge: undefined,
      maxAge: undefined,
      rank: undefined,
      minExperience: undefined,
    });
  };

  const hasActiveFilters = filters.area || filters.minAge || filters.maxAge || filters.rank || filters.minExperience != null;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-main)]">
          キャスト検索
        </h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
            showFilters || hasActiveFilters
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-[var(--text-sub)] border-gray-200 hover:bg-gray-50"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          フィルター
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-white rounded-full" />
          )}
        </button>
      </div>

      {/* フィルターパネル */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* エリア */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-sub)] mb-1.5">エリア</label>
              <AreaSelect
                value={filters.area}
                onChange={(v) => setFilters((prev) => ({ ...prev, area: v }))}
                placeholder="全て"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            {/* 年齢 */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-sub)] mb-1.5">年齢</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={18}
                  max={99}
                  value={filters.minAge ?? ""}
                  onChange={(e) => setFilters((prev) => ({ ...prev, minAge: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="18"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
                <span className="text-[var(--text-sub)] text-sm">〜</span>
                <input
                  type="number"
                  min={18}
                  max={99}
                  value={filters.maxAge ?? ""}
                  onChange={(e) => setFilters((prev) => ({ ...prev, maxAge: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="99"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
            </div>

            {/* ランク */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-sub)] mb-1.5">ランク</label>
              <select
                value={filters.rank ?? ""}
                onChange={(e) => setFilters((prev) => ({ ...prev, rank: (e.target.value || undefined) as Filters["rank"] }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                {RANK_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* 経験年数 */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-sub)] mb-1.5">最低経験年数</label>
              <input
                type="number"
                min={0}
                value={filters.minExperience ?? ""}
                onChange={(e) => setFilters((prev) => ({ ...prev, minExperience: e.target.value ? Number(e.target.value) : undefined }))}
                placeholder="指定なし"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-sm text-[var(--text-sub)] hover:text-[var(--text-main)] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                フィルターをクリア
              </button>
            </div>
          )}
        </div>
      )}

      {/* 結果 */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-[var(--text-sub)]">検索中...</div>
        </div>
      ) : allCasts.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-100 text-center">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-[var(--text-sub)] mb-2">
            条件に合うキャストが見つかりませんでした
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-slate-600 hover:text-slate-900 underline"
            >
              フィルターをクリアして再検索
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-[var(--text-sub)] mb-4">
            {allCasts.length}件のキャストが見つかりました
            {hasNextPage && "（さらに読み込み可能）"}
          </p>
          <div className="grid grid-cols-1 gap-4">
            {allCasts.map((cast) => (
              <CastCard
                key={cast.id}
                cast={cast}
                onDetail={setDetailCastId}
                onOffer={handleOfferFromCard}
              />
            ))}
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

      {/* キャスト詳細モーダル */}
      <CastDetailModal
        cast={detailCast}
        open={!!detailCastId}
        onClose={() => setDetailCastId(null)}
        onOffer={handleOfferFromDetail}
      />

      {/* オファー送信ダイアログ */}
      <SendOfferDialog
        open={!!offerTarget}
        storeId={storeId}
        castId={offerTarget?.id ?? null}
        castNickname={offerTarget?.nickname ?? ""}
        onClose={() => setOfferTarget(null)}
        onSuccess={handleOfferSuccess}
      />
    </div>
  );
}
