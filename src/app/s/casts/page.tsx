"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { RankBadge } from "@/components/ui/rank-badge";
import { ApplicantListItem } from "@/components/store/applicant-list-item";
import { trpc } from "@/lib/trpc";
import { Search, X, Wine, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { AreaSelect } from "@/components/ui/area-select";

const RANKS = [
  { value: "", label: "すべて" },
  { value: "S", label: "Sランク" },
  { value: "A", label: "Aランク" },
  { value: "B", label: "Bランク" },
  { value: "C", label: "Cランク" },
];

const ALCOHOL_LABELS: Record<string, string> = {
  STRONG: "強い",
  MODERATE: "普通",
  WEAK: "弱い",
  NONE: "飲めない",
};

const AGE_OPTIONS = [
  { value: "", label: "指定なし" },
  ...Array.from({ length: 33 }, (_, i) => ({
    value: String(18 + i),
    label: `${18 + i}歳`,
  })),
];

const EXPERIENCE_OPTIONS = [
  { value: "", label: "指定なし" },
  { value: "0", label: "未経験" },
  ...Array.from({ length: 10 }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1}年`,
  })),
  { value: "15", label: "15年" },
  { value: "20", label: "20年" },
  { value: "25", label: "25年以上" },
];

type CastRank = "C" | "B" | "A" | "S";

type CastData = {
  id: string;
  nickname: string;
  age: number;
  rank: CastRank;
  photos: string[];
  desiredAreas: string[];
  totalExperienceYears: number | null;
  previousHourlyRate: number | null;
  monthlySales: number | null;
  monthlyNominations: number | null;
  alcoholTolerance: string | null;
  description: string | null;
};

export default function CastsSearchPage() {
  const [filters, setFilters] = useState({
    area: "",
    minAge: undefined as number | undefined,
    maxAge: undefined as number | undefined,
    rank: "" as "" | CastRank,
    minExperience: undefined as number | undefined,
    maxExperience: undefined as number | undefined,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCast, setSelectedCast] = useState<string | null>(null);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [offerMessage, setOfferMessage] = useState("");

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.store.searchCasts.useInfiniteQuery(
      {
        ...filters,
        rank: (filters.rank || undefined) as "C" | "B" | "A" | "S" | undefined,
        minExperience: filters.minExperience,
        maxExperience: filters.maxExperience,
        limit: 20,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

  const sendOffer = trpc.store.sendOffer.useMutation({
    onSuccess: () => {
      alert("オファーを送信しました");
      setSelectedCast(null);
      setOfferMessage("");
    },
    onError: (error) => {
      alert(`エラー: ${error.message}`);
    },
  });

  const handleSendOffer = () => {
    if (!selectedCast || !offerMessage.trim()) return;
    sendOffer.mutate({
      castId: selectedCast,
      message: offerMessage,
    });
  };

  const casts = data?.pages.flatMap((page) => page.casts) ?? [];

  const handleDetail = (castId: string) => {
    const index = casts.findIndex((c) => c.id === castId);
    if (index !== -1) setDetailIndex(index);
  };

  const detailCast = detailIndex !== null ? (casts[detailIndex] as CastData | undefined) ?? null : null;

  const goNext = useCallback(() => {
    if (detailIndex !== null && detailIndex < casts.length - 1) {
      setDetailIndex(detailIndex + 1);
    }
  }, [detailIndex, casts.length]);

  const goPrev = useCallback(() => {
    if (detailIndex !== null && detailIndex > 0) {
      setDetailIndex(detailIndex - 1);
    }
  }, [detailIndex]);

  useEffect(() => {
    if (detailIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") setDetailIndex(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [detailIndex, goNext, goPrev]);

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-(--text-main)">応募者一覧</h1>
          <p className="text-(--text-sub) mt-1">登録中のキャストを確認してオファーを送りましょう</p>
        </div>
        {!isLoading && casts.length > 0 && (
          <span className="text-sm text-(--text-sub) flex-shrink-0">
            {casts.length}件
          </span>
        )}
      </div>

      {/* フィルターバー */}
      <div className="border border-gray-200 rounded-lg bg-white">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-(--text-main) hover:bg-gray-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-(--text-sub)" />
            絞り込み条件
            {(filters.area || filters.minAge || filters.maxAge || filters.rank || filters.minExperience != null || filters.maxExperience != null) && (
              <span className="px-1.5 py-0.5 bg-slate-50 text-slate-700 text-xs rounded font-medium">
                適用中
              </span>
            )}
          </span>
          {showFilters ? (
            <ChevronUp className="w-4 h-4 text-(--text-sub)" />
          ) : (
            <ChevronDown className="w-4 h-4 text-(--text-sub)" />
          )}
        </button>

        {showFilters && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              <div>
                <label className="block text-sm font-medium text-(--text-main) mb-1">エリア</label>
                <AreaSelect
                  value={filters.area}
                  onChange={(v) => setFilters({ ...filters, area: v })}
                  placeholder="すべて"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-(--text-main) mb-1">年齢</label>
                <div className="flex items-center gap-2">
                  <select
                    value={filters.minAge ?? ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        minAge: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  >
                    {AGE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <span className="text-(--text-sub)">〜</span>
                  <select
                    value={filters.maxAge ?? ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        maxAge: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  >
                    {AGE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-(--text-main) mb-1">経験年数</label>
                <div className="flex items-center gap-2">
                  <select
                    value={filters.minExperience ?? ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        minExperience: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  >
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <span className="text-(--text-sub)">〜</span>
                  <select
                    value={filters.maxExperience ?? ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        maxExperience: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  >
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-(--text-main) mb-1">ランク</label>
                <select
                  value={filters.rank}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      rank: e.target.value as typeof filters.rank,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  {RANKS.map((rank) => (
                    <option key={rank.value} value={rank.value}>
                      {rank.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 応募者リスト */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : casts.length === 0 ? (
        <EmptyState
          icon={Search}
          title="条件に合うキャストが見つかりませんでした"
          description="検索条件を変更してみてください"
        />
      ) : (
        <>
          <div className="space-y-2">
            {casts.map((cast) => (
              <ApplicantListItem
                key={cast.id}
                cast={cast}
                onDetail={handleDetail}
                onOffer={setSelectedCast}
              />
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                isLoading={isFetchingNextPage}
              >
                もっと見る
              </Button>
            </div>
          )}
        </>
      )}

      {/* 詳細モーダル */}
      {detailCast && detailIndex !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          {/* 左矢印 */}
          {detailIndex > 0 && (
            <button
              onClick={goPrev}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* 右矢印 */}
          {detailIndex < casts.length - 1 && (
            <button
              onClick={goNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* ヘッダー画像 */}
            <div className="relative aspect-[16/9] bg-gray-200">
              {detailCast.photos[0] ? (
                <img
                  src={detailCast.photos[0]}
                  alt={detailCast.nickname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Photo
                </div>
              )}
              {/* 位置インジケーター */}
              <div className="absolute top-3 left-3 px-2 py-1 bg-black/40 rounded text-white text-xs font-medium">
                {detailIndex + 1} / {casts.length}
              </div>
              <button
                onClick={() => setDetailIndex(null)}
                className="absolute top-3 right-3 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* 名前・年齢・ランク */}
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-(--text-main)">
                  {detailCast.nickname}
                </h2>
                <span className="text-(--text-sub)">{detailCast.age}歳</span>
                <RankBadge rank={detailCast.rank} size="md" />
              </div>

              {/* 基本情報 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-(--bg-gray) rounded-lg p-3">
                  <p className="text-xs text-(--text-sub) mb-0.5">経験年数</p>
                  <p className="text-sm font-medium text-(--text-main)">
                    {detailCast.totalExperienceYears != null && detailCast.totalExperienceYears > 0
                      ? `${detailCast.totalExperienceYears}年`
                      : "未経験"}
                  </p>
                </div>
                <div className="bg-(--bg-gray) rounded-lg p-3">
                  <p className="text-xs text-(--text-sub) mb-0.5">前職時給</p>
                  <p className="text-sm font-medium text-(--text-main)">
                    {detailCast.previousHourlyRate != null
                      ? `¥${detailCast.previousHourlyRate.toLocaleString()}`
                      : "−"}
                  </p>
                </div>
                {detailCast.monthlySales != null && (
                  <div className="bg-(--bg-gray) rounded-lg p-3">
                    <p className="text-xs text-(--text-sub) mb-0.5">月間売上</p>
                    <p className="text-sm font-medium text-(--text-main)">
                      ¥{detailCast.monthlySales.toLocaleString()}
                    </p>
                  </div>
                )}
                {detailCast.monthlyNominations != null && (
                  <div className="bg-(--bg-gray) rounded-lg p-3">
                    <p className="text-xs text-(--text-sub) mb-0.5">月間指名数</p>
                    <p className="text-sm font-medium text-(--text-main)">
                      {detailCast.monthlyNominations}本
                    </p>
                  </div>
                )}
              </div>

              {/* お酒の強さ */}
              {detailCast.alcoholTolerance && (
                <div className="flex items-center gap-2">
                  <Wine className="w-4 h-4 text-(--text-sub)" />
                  <span className="text-sm text-(--text-sub)">お酒:</span>
                  <span className="text-sm text-(--text-main) font-medium">
                    {ALCOHOL_LABELS[detailCast.alcoholTolerance] ?? detailCast.alcoholTolerance}
                  </span>
                </div>
              )}

              {/* 希望エリア */}
              {detailCast.desiredAreas.length > 0 && (
                <div>
                  <p className="text-xs text-(--text-sub) mb-1.5">希望エリア</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detailCast.desiredAreas.map((area) => (
                      <span
                        key={area}
                        className="px-2.5 py-1 bg-slate-50 text-slate-700 text-xs rounded font-medium"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 自己紹介 */}
              {detailCast.description && (
                <div>
                  <p className="text-xs text-(--text-sub) mb-1.5">自己紹介</p>
                  <p className="text-sm text-(--text-main) leading-relaxed">
                    {detailCast.description}
                  </p>
                </div>
              )}

              {/* アクション */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setDetailIndex(null)}
                  className="flex-1"
                >
                  閉じる
                </Button>
                <Button
                  onClick={() => {
                    setDetailIndex(null);
                    setSelectedCast(detailCast.id);
                  }}
                  className="flex-1"
                >
                  オファーを送る
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* オファーモーダル */}
      {selectedCast && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-(--text-main) mb-4">
              オファーを送信
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-(--text-main) mb-1">
                メッセージ <span className="text-red-500">*</span>
              </label>
              <textarea
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                placeholder="キャストへのメッセージを入力してください"
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none"
              />
              <p className="text-sm text-(--text-sub) mt-1">
                店舗の魅力や希望条件などを伝えましょう
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCast(null);
                  setOfferMessage("");
                }}
                className="flex-1"
              >
                キャンセル
              </Button>
              <Button
                onClick={handleSendOffer}
                isLoading={sendOffer.isPending}
                disabled={!offerMessage.trim()}
                className="flex-1"
              >
                送信する
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
