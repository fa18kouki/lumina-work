"use client";

import type { WorkConditions } from "@/lib/types/store";
import type { SectionProps } from "./types";

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-gray-200 peer-checked:bg-slate-600 rounded-full transition-colors" />
        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform" />
      </div>
      <span className="text-sm text-[var(--text-main)]">{label}</span>
    </label>
  );
}

export function WorkConditionsSection({ form, onUpdate }: SectionProps) {
  const wc = form.workConditions ?? { minWorkDays: undefined, minWorkHours: undefined, lastTrainOk: false, flexibleSchedule: false };

  const updateWC = (partial: Partial<WorkConditions>) => {
    onUpdate({ workConditions: { ...wc, ...partial } });
  };

  return (
    <section className="bg-white rounded-xl border border-gray-100 p-6">
      <h2 className="text-base font-bold text-[var(--text-main)] mb-4">勤務条件</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">最低出勤日数（週）</label>
            <input
              type="number"
              value={wc.minWorkDays ?? ""}
              onChange={(e) => updateWC({ minWorkDays: e.target.value ? Number(e.target.value) : undefined })}
              min={1}
              max={7}
              placeholder="例: 1"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">最低勤務時間</label>
            <input
              type="number"
              value={wc.minWorkHours ?? ""}
              onChange={(e) => updateWC({ minWorkHours: e.target.value ? Number(e.target.value) : undefined })}
              min={1}
              max={12}
              placeholder="例: 3"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Toggle
            label="終電対応OK"
            checked={wc.lastTrainOk ?? false}
            onChange={(v) => updateWC({ lastTrainOk: v })}
          />
          <Toggle
            label="自由出勤（シフト自由）"
            checked={wc.flexibleSchedule ?? false}
            onChange={(v) => updateWC({ flexibleSchedule: v })}
          />
          <Toggle
            label="ノルマなし"
            checked={!form.hasQuota}
            onChange={(v) => onUpdate({ hasQuota: !v })}
          />
          <Toggle
            label="飲酒不要"
            checked={!form.drinkingRequired}
            onChange={(v) => onUpdate({ drinkingRequired: !v })}
          />
        </div>
      </div>
    </section>
  );
}
