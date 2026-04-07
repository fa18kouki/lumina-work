"use client";

import { useState, useEffect, useCallback } from "react";
import { X, RotateCcw } from "lucide-react";

// ==================== 型定義 ====================

export interface StoreFilterState {
  storeType: string | null;
  minSalary: number | null;
  hasTransportation: boolean;
  hasDressRental: boolean;
  hasDailyPay: boolean;
  hasNoQuota: boolean;
  hasDormitory: boolean;
  hasNursery: boolean;
}

export const INITIAL_FILTER_STATE: StoreFilterState = {
  storeType: null,
  minSalary: null,
  hasTransportation: false,
  hasDressRental: false,
  hasDailyPay: false,
  hasNoQuota: false,
  hasDormitory: false,
  hasNursery: false,
};

interface StoreFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: StoreFilterState;
  onApply: (filters: StoreFilterState) => void;
  resultCount?: number;
}

// ==================== 定数 ====================

const STORE_TYPES = [
  { value: "CABARET", label: "キャバクラ" },
  { value: "CLUB", label: "クラブ" },
  { value: "LOUNGE", label: "ラウンジ" },
  { value: "GIRLS_BAR", label: "ガールズバー" },
  { value: "SNACK", label: "スナック" },
  { value: "OTHER", label: "その他" },
] as const;

const SALARY_OPTIONS = [
  { value: 3000, label: "3,000円〜" },
  { value: 4000, label: "4,000円〜" },
  { value: 5000, label: "5,000円〜" },
  { value: 6000, label: "6,000円〜" },
  { value: 7000, label: "7,000円〜" },
  { value: 8000, label: "8,000円〜" },
  { value: 10000, label: "10,000円〜" },
] as const;

const TOGGLE_OPTIONS: ReadonlyArray<{
  key: keyof Pick<
    StoreFilterState,
    | "hasTransportation"
    | "hasDressRental"
    | "hasDailyPay"
    | "hasNoQuota"
    | "hasDormitory"
    | "hasNursery"
  >;
  label: string;
}> = [
  { key: "hasTransportation", label: "送りあり" },
  { key: "hasDressRental", label: "ドレス貸与" },
  { key: "hasDailyPay", label: "日払い" },
  { key: "hasNoQuota", label: "ノルマなし" },
  { key: "hasDormitory", label: "寮あり" },
  { key: "hasNursery", label: "託児所あり" },
];

// ==================== ヘルパー ====================

export function countActiveFilters(filters: StoreFilterState): number {
  let count = 0;
  if (filters.storeType) count++;
  if (filters.minSalary) count++;
  if (filters.hasTransportation) count++;
  if (filters.hasDressRental) count++;
  if (filters.hasDailyPay) count++;
  if (filters.hasNoQuota) count++;
  if (filters.hasDormitory) count++;
  if (filters.hasNursery) count++;
  return count;
}

// ==================== コンポーネント ====================

export function StoreFilterPanel({
  isOpen,
  onClose,
  filters,
  onApply,
  resultCount,
}: StoreFilterPanelProps) {
  const [draft, setDraft] = useState<StoreFilterState>(filters);

  // パネルが開くたびに外部stateと同期
  useEffect(() => {
    if (isOpen) {
      setDraft(filters);
    }
  }, [isOpen, filters]);

  // スクロールロック
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleReset = useCallback(() => {
    setDraft(INITIAL_FILTER_STATE);
  }, []);

  const handleApply = useCallback(() => {
    onApply(draft);
    onClose();
  }, [draft, onApply, onClose]);

  const handleOverlayClick = useCallback(() => {
    onClose();
  }, [onClose]);

  const updateDraft = useCallback(
    <K extends keyof StoreFilterState>(key: K, value: StoreFilterState[K]) => {
      setDraft((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return (
    <>
      {/* オーバーレイ */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* ボトムシート */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="詳細フィルター"
        className={`fixed inset-x-0 bottom-0 z-[70] bg-white rounded-t-2xl shadow-lg transition-transform duration-300 ease-out max-h-[85vh] flex flex-col ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-(--text-main)">
            詳細フィルター
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="閉じる"
          >
            <X className="w-5 h-5 text-(--text-sub)" />
          </button>
        </div>

        {/* コンテンツ（スクロール） */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* 業種 */}
          <FilterSection title="業種">
            <div className="flex flex-wrap gap-2">
              {STORE_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() =>
                    updateDraft(
                      "storeType",
                      draft.storeType === type.value ? null : type.value
                    )
                  }
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    draft.storeType === type.value
                      ? "bg-(--primary) text-white"
                      : "bg-gray-100 text-(--text-sub) hover:bg-gray-200"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* 最低時給 */}
          <FilterSection title="最低時給">
            <div className="flex flex-wrap gap-2">
              {SALARY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    updateDraft(
                      "minSalary",
                      draft.minSalary === opt.value ? null : opt.value
                    )
                  }
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    draft.minSalary === opt.value
                      ? "bg-(--primary) text-white"
                      : "bg-gray-100 text-(--text-sub) hover:bg-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* トグル項目 */}
          <FilterSection title="こだわり条件">
            <div className="space-y-1">
              {TOGGLE_OPTIONS.map((opt) => (
                <ToggleRow
                  key={opt.key}
                  label={opt.label}
                  checked={draft[opt.key]}
                  onChange={(checked) => updateDraft(opt.key, checked)}
                />
              ))}
            </div>
          </FilterSection>
        </div>

        {/* フッター */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium text-(--text-sub) bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            リセット
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-(--primary) hover:opacity-90 transition-opacity"
          >
            {resultCount !== undefined
              ? `${resultCount}件を表示`
              : "フィルターを適用"}
          </button>
        </div>
      </div>
    </>
  );
}

// ==================== サブコンポーネント ====================

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-bold text-(--text-main) mb-3">{title}</h3>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer">
      <span className="text-sm text-(--text-main)">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? "bg-(--primary)" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}
