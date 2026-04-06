"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SectionProps } from "./types";

function Toggle({ label, checked, onChange, children }: { label: string; checked: boolean; onChange: (v: boolean) => void; children?: React.ReactNode }) {
  return (
    <div>
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
      {checked && children && <div className="mt-2 ml-12">{children}</div>}
    </div>
  );
}

export function BenefitsSection({ form, onUpdate }: SectionProps) {
  const [newBenefit, setNewBenefit] = useState("");

  const addBenefit = () => {
    if (newBenefit.trim()) {
      onUpdate({ benefits: [...form.benefits, newBenefit.trim()] });
      setNewBenefit("");
    }
  };

  const removeBenefit = (index: number) => {
    onUpdate({ benefits: form.benefits.filter((_, i) => i !== index) });
  };

  return (
    <section className="bg-white rounded-xl border border-gray-100 p-6">
      <h2 className="text-base font-bold text-[var(--text-main)] mb-4">福利厚生・待遇</h2>
      <div className="space-y-4">
        {/* トグル付き待遇 */}
        <div className="space-y-3">
          <Toggle
            label="送迎あり"
            checked={form.hasTransportation}
            onChange={(v) => onUpdate({ hasTransportation: v })}
          >
            <input
              type="text"
              value={form.transportationDetails}
              onChange={(e) => onUpdate({ transportationDetails: e.target.value })}
              maxLength={200}
              placeholder="例: 名古屋市内送迎可"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </Toggle>

          <Toggle
            label="寮完備"
            checked={form.hasDormitory}
            onChange={(v) => onUpdate({ hasDormitory: v })}
          >
            <input
              type="text"
              value={form.dormitoryDetails}
              onChange={(e) => onUpdate({ dormitoryDetails: e.target.value })}
              maxLength={200}
              placeholder="例: 初期費用会社負担、家具付き"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </Toggle>

          <Toggle
            label="ドレス・衣装レンタル無料"
            checked={form.hasDressRental}
            onChange={(v) => onUpdate({ hasDressRental: v })}
          />

          <Toggle
            label="ヘアメイク完備"
            checked={form.hasHairMakeup}
            onChange={(v) => onUpdate({ hasHairMakeup: v })}
          />

          <Toggle
            label="託児所完備"
            checked={form.hasNursery}
            onChange={(v) => onUpdate({ hasNursery: v })}
          />

          <Toggle
            label="提携セットサロンあり"
            checked={form.hasPartnerSalon}
            onChange={(v) => onUpdate({ hasPartnerSalon: v })}
          >
            <input
              type="text"
              value={form.partnerSalonDetails}
              onChange={(e) => onUpdate({ partnerSalonDetails: e.target.value })}
              maxLength={200}
              placeholder="例: 提携サロン割引利用可"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </Toggle>
        </div>

        {/* カスタム福利厚生タグ */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-main)] mb-2">その他の待遇</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {form.benefits.map((b, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-3 py-1 bg-slate-50 text-slate-700 text-sm rounded-lg"
              >
                {b}
                <button type="button" onClick={() => removeBenefit(i)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newBenefit}
              onChange={(e) => setNewBenefit(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addBenefit(); } }}
              placeholder="例: Wワーク歓迎、制服支給..."
              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
            <Button type="button" variant="outline" onClick={addBenefit} disabled={!newBenefit.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
