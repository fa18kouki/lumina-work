"use client";

import { DAILY_PAY_TYPES } from "@/lib/constants";
import type { SalarySystem } from "@/lib/types/store";
import type { SectionProps } from "./types";

export function SalarySection({ form, onUpdate }: SectionProps) {
  const updateSalary = (partial: Partial<SalarySystem>) => {
    onUpdate({ salary: { ...form.salary, ...partial } });
  };

  return (
    <section className="bg-white rounded-xl border border-gray-100 p-6">
      <h2 className="text-base font-bold text-[var(--text-main)] mb-4">給与・報酬</h2>
      <div className="space-y-4">
        {/* 時給レンジ */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">時給レンジ</label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-sub)]">¥</span>
              <input
                type="number"
                value={form.salary.hourlyRateMin}
                onChange={(e) => updateSalary({ hourlyRateMin: Number(e.target.value) })}
                min={1000}
                max={100000}
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
            <span className="text-[var(--text-sub)]">〜</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-sub)]">¥</span>
              <input
                type="number"
                value={form.salary.hourlyRateMax}
                onChange={(e) => updateSalary({ hourlyRateMax: Number(e.target.value) })}
                min={1000}
                max={100000}
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
          </div>
        </div>

        {/* バック系 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {([
            { label: "同伴バック", minKey: "companionBackMin", maxKey: "companionBackMax" },
            { label: "ドリンクバック", minKey: "drinkBackMin", maxKey: "drinkBackMax" },
            { label: "指名バック", minKey: "nominationBackMin", maxKey: "nominationBackMax" },
          ] as const).map(({ label, minKey, maxKey }) => (
            <div key={label}>
              <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">{label}</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-sub)]">¥</span>
                  <input
                    type="number"
                    value={form.salary[minKey] ?? ""}
                    onChange={(e) => updateSalary({ [minKey]: e.target.value ? Number(e.target.value) : undefined })}
                    min={0}
                    placeholder="0"
                    className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <span className="text-xs text-[var(--text-sub)]">〜</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-sub)]">¥</span>
                  <input
                    type="number"
                    value={form.salary[maxKey] ?? ""}
                    onChange={(e) => updateSalary({ [maxKey]: e.target.value ? Number(e.target.value) : undefined })}
                    min={0}
                    placeholder="0"
                    className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 日払い・祝い金 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">日払い対応</label>
            <select
              value={form.dailyPayType}
              onChange={(e) => onUpdate({ dailyPayType: e.target.value as typeof form.dailyPayType })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              {DAILY_PAY_TYPES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">入店祝い金</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-sub)]">¥</span>
              <input
                type="number"
                value={form.signingBonus ?? ""}
                onChange={(e) => onUpdate({ signingBonus: e.target.value ? Number(e.target.value) : null })}
                min={0}
                placeholder="なし"
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
