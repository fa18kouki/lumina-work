"use client";

import { ALCOHOL_OPTIONS } from "@/lib/constants";

interface ShiftPreferences {
  days: string;
  dayOfWeek: string;
  workingHours: string;
}

interface Props {
  data: {
    desiredAreas: string[];
    desiredHourlyRate: number | null;
    desiredMonthlyIncome: number | null;
    availableDaysPerWeek: number | null;
    alcoholTolerance: string;
    shiftPreferences: ShiftPreferences;
    motivation: string;
    storePreferences: string;
    customerCount: number | null;
    salesTarget: number | null;
    previousStorePerformance: string;
    guaranteedHourlyRate: number | null;
    guaranteePeriod: string;
    specialConditions: string;
  };
  onChange: (field: string, value: unknown) => void;
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-(--text-main) mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-(--text-main) focus:outline-none focus:ring-2 focus:ring-(--primary)/30 focus:border-(--primary)";

const selectClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-(--text-main) bg-white focus:outline-none focus:ring-2 focus:ring-(--primary)/30 focus:border-(--primary)";

export function PreferenceSection({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-(--text-main) border-b border-gray-100 pb-2">
        希望条件
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="希望時給">
          <div className="flex items-center gap-2">
            <input
              type="number"
              className={inputClass}
              value={data.desiredHourlyRate ?? ""}
              onChange={(e) =>
                onChange(
                  "desiredHourlyRate",
                  e.target.value ? Number(e.target.value) : null
                )
              }
              min={0}
              placeholder="5000"
            />
            <span className="text-sm text-(--text-sub)">円</span>
          </div>
        </FormField>

        <FormField label="希望月収">
          <div className="flex items-center gap-2">
            <input
              type="number"
              className={inputClass}
              value={data.desiredMonthlyIncome ?? ""}
              onChange={(e) =>
                onChange(
                  "desiredMonthlyIncome",
                  e.target.value ? Number(e.target.value) : null
                )
              }
              min={0}
              placeholder="500000"
            />
            <span className="text-sm text-(--text-sub)">円</span>
          </div>
        </FormField>

        <FormField label="出勤可能日数（週）">
          <div className="flex items-center gap-2">
            <input
              type="number"
              className={inputClass}
              value={data.availableDaysPerWeek ?? ""}
              onChange={(e) =>
                onChange(
                  "availableDaysPerWeek",
                  e.target.value ? Number(e.target.value) : null
                )
              }
              min={1}
              max={7}
            />
            <span className="text-sm text-(--text-sub)">日</span>
          </div>
        </FormField>

        <FormField label="お酒の強さ">
          <select
            className={selectClass}
            value={data.alcoholTolerance}
            onChange={(e) => onChange("alcoholTolerance", e.target.value)}
          >
            <option value="">選択してください</option>
            {ALCOHOL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="保証時給">
          <div className="flex items-center gap-2">
            <input
              type="number"
              className={inputClass}
              value={data.guaranteedHourlyRate ?? ""}
              onChange={(e) =>
                onChange(
                  "guaranteedHourlyRate",
                  e.target.value ? Number(e.target.value) : null
                )
              }
              min={0}
            />
            <span className="text-sm text-(--text-sub)">円</span>
          </div>
        </FormField>

        <FormField label="保証期間">
          <input
            type="text"
            className={inputClass}
            value={data.guaranteePeriod}
            onChange={(e) => onChange("guaranteePeriod", e.target.value)}
            placeholder="3ヶ月"
          />
        </FormField>

        <FormField label="売上目標">
          <div className="flex items-center gap-2">
            <input
              type="number"
              className={inputClass}
              value={data.salesTarget ?? ""}
              onChange={(e) =>
                onChange(
                  "salesTarget",
                  e.target.value ? Number(e.target.value) : null
                )
              }
              min={0}
            />
            <span className="text-sm text-(--text-sub)">円</span>
          </div>
        </FormField>

        <FormField label="指名本数目標">
          <div className="flex items-center gap-2">
            <input
              type="number"
              className={inputClass}
              value={data.customerCount ?? ""}
              onChange={(e) =>
                onChange(
                  "customerCount",
                  e.target.value ? Number(e.target.value) : null
                )
              }
              min={0}
            />
            <span className="text-sm text-(--text-sub)">本</span>
          </div>
        </FormField>
      </div>

      <h3 className="text-base font-semibold text-(--text-main) border-b border-gray-100 pb-2 pt-2">
        シフト希望
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="出勤日数">
          <input
            type="text"
            className={inputClass}
            value={data.shiftPreferences?.days ?? ""}
            onChange={(e) =>
              onChange("shiftPreferences", {
                ...data.shiftPreferences,
                days: e.target.value,
              })
            }
            placeholder="週3〜4日"
          />
        </FormField>

        <FormField label="出勤曜日">
          <input
            type="text"
            className={inputClass}
            value={data.shiftPreferences?.dayOfWeek ?? ""}
            onChange={(e) =>
              onChange("shiftPreferences", {
                ...data.shiftPreferences,
                dayOfWeek: e.target.value,
              })
            }
            placeholder="月・水・金"
          />
        </FormField>

        <FormField label="勤務時間">
          <input
            type="text"
            className={inputClass}
            value={data.shiftPreferences?.workingHours ?? ""}
            onChange={(e) =>
              onChange("shiftPreferences", {
                ...data.shiftPreferences,
                workingHours: e.target.value,
              })
            }
            placeholder="20:00〜1:00"
          />
        </FormField>
      </div>

      <h3 className="text-base font-semibold text-(--text-main) border-b border-gray-100 pb-2 pt-2">
        志望理由・その他
      </h3>

      <div className="space-y-4">
        <FormField label="志望動機">
          <textarea
            className={`${inputClass} min-h-[80px]`}
            value={data.motivation}
            onChange={(e) => onChange("motivation", e.target.value)}
            placeholder="ナイトワークを始めたいきっかけや目標"
          />
        </FormField>

        <FormField label="希望する店舗の雰囲気">
          <textarea
            className={`${inputClass} min-h-[60px]`}
            value={data.storePreferences}
            onChange={(e) => onChange("storePreferences", e.target.value)}
            placeholder="落ち着いた雰囲気、アットホームなど"
          />
        </FormField>

        <FormField label="前店舗での実績">
          <textarea
            className={`${inputClass} min-h-[60px]`}
            value={data.previousStorePerformance}
            onChange={(e) =>
              onChange("previousStorePerformance", e.target.value)
            }
          />
        </FormField>

        <FormField label="特別条件・要望">
          <textarea
            className={`${inputClass} min-h-[60px]`}
            value={data.specialConditions}
            onChange={(e) => onChange("specialConditions", e.target.value)}
            placeholder="その他の希望条件があれば記入してください"
          />
        </FormField>
      </div>
    </div>
  );
}
