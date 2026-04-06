"use client";

import type { TrialShiftInfo } from "@/lib/types/store";
import type { SectionProps } from "./types";

export function TrialShiftSection({ form, onUpdate }: SectionProps) {
  const info = form.trialShiftInfo ?? { trialHourlyRate: undefined, trialCount: undefined, trialConditions: "" };

  const updateInfo = (partial: Partial<TrialShiftInfo>) => {
    onUpdate({ trialShiftInfo: { ...info, ...partial } });
  };

  return (
    <section className="bg-white rounded-xl border border-gray-100 p-6">
      <h2 className="text-base font-bold text-[var(--text-main)] mb-4">体験入店情報</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">体験時給</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-sub)]">¥</span>
              <input
                type="number"
                value={info.trialHourlyRate ?? ""}
                onChange={(e) => updateInfo({ trialHourlyRate: e.target.value ? Number(e.target.value) : undefined })}
                min={0}
                placeholder="例: 20000"
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">体験可能回数</label>
            <input
              type="number"
              value={info.trialCount ?? ""}
              onChange={(e) => updateInfo({ trialCount: e.target.value ? Number(e.target.value) : undefined })}
              min={1}
              max={10}
              placeholder="例: 3"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">体験条件・備考</label>
          <textarea
            value={info.trialConditions ?? ""}
            onChange={(e) => updateInfo({ trialConditions: e.target.value })}
            rows={3}
            maxLength={500}
            placeholder="例: 18歳以上、身分証明書持参、全額日払い対応..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
          />
        </div>
      </div>
    </section>
  );
}
