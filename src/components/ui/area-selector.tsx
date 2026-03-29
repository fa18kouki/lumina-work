"use client";

import { useState, useRef, useCallback } from "react";
import { Search, X } from "lucide-react";
import {
  REGION_DATA,
  searchAreas,
  getAreaLabel,
  type RegionGroup,
  type PrefectureGroup,
  type CityGroup,
} from "@/lib/areas";

interface AreaSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
}

/**
 * エリア複数選択コンポーネント（左タブ+右パネル構成）
 * valueにはエリアのlabel（表示名）配列を使用
 */
export function AreaSelector({ value, onChange, className = "" }: AreaSelectorProps) {
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isSelected = useCallback(
    (label: string) => value.includes(label),
    [value]
  );

  const toggleArea = useCallback(
    (label: string) => {
      onChange(
        value.includes(label)
          ? value.filter((v) => v !== label)
          : [...value, label]
      );
    },
    [value, onChange]
  );

  const toggleMultiple = useCallback(
    (labels: string[], forceSelect?: boolean) => {
      const allSelected =
        forceSelect === undefined
          ? labels.every((l) => value.includes(l))
          : !forceSelect;

      if (allSelected) {
        onChange(value.filter((v) => !labels.includes(v)));
      } else {
        const newLabels = labels.filter((l) => !value.includes(l));
        onChange([...value, ...newLabels]);
      }
    },
    [value, onChange]
  );

  const removeArea = useCallback(
    (label: string) => {
      onChange(value.filter((v) => v !== label));
    },
    [value, onChange]
  );

  // 都道府県配下の全ラベル
  const getPrefLabels = (pref: PrefectureGroup): string[] => {
    const labels: string[] = [];
    if (pref.cities) {
      for (const city of pref.cities) {
        labels.push(...city.areas.map((a) => a.label));
      }
    }
    if (pref.areas) {
      labels.push(...pref.areas.map((a) => a.label));
    }
    return labels;
  };

  // 都市配下の全ラベル
  const getCityLabels = (city: CityGroup): string[] =>
    city.areas.map((a) => a.label);

  // チェック状態の判定
  const getCheckState = (
    labels: string[]
  ): "checked" | "indeterminate" | "unchecked" => {
    const selectedCount = labels.filter((l) => value.includes(l)).length;
    if (selectedCount === 0) return "unchecked";
    if (selectedCount === labels.length) return "checked";
    return "indeterminate";
  };

  // 検索結果
  const searchResults = searchQuery.trim()
    ? searchAreas(searchQuery)
    : null;

  const currentRegion = REGION_DATA.find((r) => r.name === activeRegion);

  return (
    <div className={`flex flex-col rounded-lg border border-gray-200 bg-white overflow-hidden ${className}`}>
      {/* 検索バー */}
      <div className="border-b border-gray-200 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="エリアを検索..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 検索結果 or メインパネル */}
      {searchResults ? (
        <div className="flex-1 min-h-0 overflow-y-auto p-3">
          {searchResults.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">
              該当するエリアが見つかりません
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {searchResults.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => toggleArea(area.label)}
                  className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                    isSelected(area.label)
                      ? "bg-pink-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {area.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 min-h-0">
          {/* 左サイド: 地方タブ */}
          <div className="w-28 shrink-0 border-r border-gray-200 bg-gray-50">
            {REGION_DATA.map((region) => (
              <RegionTab
                key={region.name}
                region={region}
                isActive={activeRegion === region.name}
                hasSelection={getAreasByRegionLabels(region).some((l) =>
                  value.includes(l)
                )}
                onClick={() => setActiveRegion(region.name)}
              />
            ))}
          </div>

          {/* 右パネル: 都道府県→都市→エリア */}
          <div className="flex-1 overflow-y-auto p-3">
            {currentRegion ? (
              currentRegion.prefectures.map((pref) => (
                <PrefectureSection
                  key={pref.name}
                  pref={pref}
                  prefLabels={getPrefLabels(pref)}
                  checkState={getCheckState(getPrefLabels(pref))}
                  getCityLabels={getCityLabels}
                  getCityCheckState={(city) =>
                    getCheckState(getCityLabels(city))
                  }
                  isSelected={isSelected}
                  toggleArea={toggleArea}
                  toggleMultiple={toggleMultiple}
                />
              ))
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                左の地域を選択してください
              </div>
            )}
          </div>
        </div>
      )}

      {/* 選択済みタグ */}
      {value.length > 0 && (
        <div className="shrink-0 border-t border-gray-200 p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">
              {value.length}件選択中
            </span>
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs text-gray-400 hover:text-pink-500"
            >
              すべて解除
            </button>
          </div>
          <div className="flex max-h-20 flex-wrap gap-1.5 overflow-y-auto">
            {value.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-2.5 py-1 text-xs text-pink-700"
              >
                {label}
                <button
                  type="button"
                  onClick={() => removeArea(label)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-pink-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 子コンポーネント ───

function getAreasByRegionLabels(region: RegionGroup): string[] {
  const labels: string[] = [];
  for (const pref of region.prefectures) {
    if (pref.cities) {
      for (const city of pref.cities) {
        labels.push(...city.areas.map((a) => a.label));
      }
    }
    if (pref.areas) {
      labels.push(...pref.areas.map((a) => a.label));
    }
  }
  return labels;
}

function RegionTab({
  region,
  isActive,
  hasSelection,
  onClick,
}: {
  region: RegionGroup;
  isActive: boolean;
  hasSelection: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full px-3 py-2.5 text-left text-sm transition-colors ${
        isActive
          ? "bg-white font-bold text-pink-600"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-pink-500" />
      )}
      {region.name}
      {hasSelection && (
        <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-pink-500" />
      )}
    </button>
  );
}

function TriCheckbox({
  state,
  onChange,
  label,
  className = "",
}: {
  state: "checked" | "indeterminate" | "unchecked";
  onChange: () => void;
  label: string;
  className?: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 ${className}`}
      onClick={(e) => {
        e.preventDefault();
        onChange();
      }}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
          state === "checked"
            ? "border-pink-500 bg-pink-500 text-white"
            : state === "indeterminate"
              ? "border-pink-500 bg-pink-100"
              : "border-gray-300 bg-white"
        }`}
      >
        {state === "checked" && (
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6L5 9L10 3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {state === "indeterminate" && (
          <span className="h-0.5 w-2 rounded bg-pink-500" />
        )}
      </span>
      <span className="text-sm">{label}</span>
    </label>
  );
}

function PrefectureSection({
  pref,
  prefLabels,
  checkState,
  getCityLabels,
  getCityCheckState,
  isSelected,
  toggleArea,
  toggleMultiple,
}: {
  pref: PrefectureGroup;
  prefLabels: string[];
  checkState: "checked" | "indeterminate" | "unchecked";
  getCityLabels: (city: CityGroup) => string[];
  getCityCheckState: (city: CityGroup) => "checked" | "indeterminate" | "unchecked";
  isSelected: (label: string) => boolean;
  toggleArea: (label: string) => void;
  toggleMultiple: (labels: string[], forceSelect?: boolean) => void;
}) {
  return (
    <div className="mb-4 last:mb-0">
      {/* 都道府県チェックボックス */}
      <TriCheckbox
        state={checkState}
        onChange={() => toggleMultiple(prefLabels)}
        label={pref.name}
        className="mb-2 font-medium text-gray-900"
      />

      <div className="ml-6 space-y-2">
        {/* 都市グループ */}
        {pref.cities?.map((city) => {
          const cityLabels = getCityLabels(city);
          return (
            <div key={city.name}>
              <TriCheckbox
                state={getCityCheckState(city)}
                onChange={() => toggleMultiple(cityLabels)}
                label={city.name}
                className="mb-1 text-gray-700"
              />
              <div className="ml-6 flex flex-wrap gap-x-4 gap-y-1">
                {city.areas.map((area) => (
                  <label
                    key={area.id}
                    className="flex cursor-pointer items-center gap-1.5"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleArea(area.label);
                    }}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                        isSelected(area.label)
                          ? "border-pink-500 bg-pink-500 text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {isSelected(area.label) && (
                        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M2 6L5 9L10 3"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span className="text-sm text-gray-600">{area.label}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}

        {/* 県直下エリア */}
        {pref.areas && pref.areas.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {pref.areas.map((area) => (
              <label
                key={area.id}
                className="flex cursor-pointer items-center gap-1.5"
                onClick={(e) => {
                  e.preventDefault();
                  toggleArea(area.label);
                }}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                    isSelected(area.label)
                      ? "border-pink-500 bg-pink-500 text-white"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {isSelected(area.label) && (
                    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6L5 9L10 3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span className="text-sm text-gray-600">{area.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
