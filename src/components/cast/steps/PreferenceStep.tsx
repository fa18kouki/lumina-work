"use client";

import type { ProfileFormData } from "../ProfileWizard";
import { AreaSelector } from "@/components/ui/area-selector";

interface PreferenceStepProps {
  data: ProfileFormData;
  onDataChange: (data: Partial<ProfileFormData>) => void;
}

const ATMOSPHERES = [
  "落ち着いた高級店",
  "アットホームな雰囲気",
  "ワイワイ盛り上がる店",
  "大箱・大型店舗",
  "少人数制",
  "新規オープン",
];

const CLIENTELES = [
  "企業役員・経営者",
  "20-30代ビジネスマン",
  "40-50代ビジネスマン",
  "富裕層",
  "芸能関係者",
  "外国人客多め",
];

export function PreferenceStep({ data, onDataChange }: PreferenceStepProps) {
  const toggleArrayItem = (
    field: "desiredAreas" | "preferredAtmosphere" | "preferredClientele",
    item: string
  ) => {
    const currentArray = data[field] || [];
    const newArray = currentArray.includes(item)
      ? currentArray.filter((i) => i !== item)
      : [...currentArray, item];
    onDataChange({ [field]: newArray });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-lg font-bold text-gray-900">希望条件</h2>
        <p className="text-sm text-gray-500">
          あなたの希望を教えてください（フィルタリングに使用）
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            希望エリア（複数選択可）
          </label>
          <AreaSelector
            value={data.desiredAreas || []}
            onChange={(areas) => onDataChange({ desiredAreas: areas })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              希望時給
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={500}
                value={data.desiredHourlyRate ?? ""}
                onChange={(e) =>
                  onDataChange({
                    desiredHourlyRate: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                placeholder="5000"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
              <span className="shrink-0 text-sm text-gray-500">円〜</span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              希望月収
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={50000}
                value={data.desiredMonthlyIncome ?? ""}
                onChange={(e) =>
                  onDataChange({
                    desiredMonthlyIncome: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                placeholder="500000"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
              <span className="shrink-0 text-sm text-gray-500">円〜</span>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            出勤可能日数
          </label>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">週</span>
            <input
              type="range"
              min={1}
              max={7}
              value={data.availableDaysPerWeek ?? 3}
              onChange={(e) =>
                onDataChange({
                  availableDaysPerWeek: parseInt(e.target.value),
                })
              }
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-pink-500"
            />
            <span className="min-w-[3rem] text-center text-lg font-bold text-pink-500">
              {data.availableDaysPerWeek ?? 3}日
            </span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            希望の雰囲気（複数選択可）
          </label>
          <div className="flex flex-wrap gap-2">
            {ATMOSPHERES.map((atmosphere) => (
              <button
                key={atmosphere}
                type="button"
                onClick={() => toggleArrayItem("preferredAtmosphere", atmosphere)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  data.preferredAtmosphere?.includes(atmosphere)
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {atmosphere}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            希望の客層（複数選択可）
          </label>
          <div className="flex flex-wrap gap-2">
            {CLIENTELES.map((clientele) => (
              <button
                key={clientele}
                type="button"
                onClick={() => toggleArrayItem("preferredClientele", clientele)}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  data.preferredClientele?.includes(clientele)
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {clientele}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
