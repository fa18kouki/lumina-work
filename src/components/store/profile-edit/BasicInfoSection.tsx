"use client";

import { BUSINESS_TYPES } from "@/lib/constants";
import { AreaSelect } from "@/components/ui/area-select";
import { PostalCodeInput } from "@/components/ui/postal-code-input";
import { getAreaAddressPrefix, findAreasByAddress } from "@/lib/areas";
import type { SectionProps } from "./types";

export function BasicInfoSection({ form, onUpdate }: SectionProps) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 p-6">
      <h2 className="text-base font-bold text-[var(--text-main)] mb-4">基本情報</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">
              店舗名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              required
              maxLength={100}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">
              業種
            </label>
            <select
              value={form.storeType ?? ""}
              onChange={(e) => onUpdate({ storeType: (e.target.value || null) as typeof form.storeType })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="">選択してください</option>
              {BUSINESS_TYPES.map((bt) => (
                <option key={bt.value} value={bt.value}>{bt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <PostalCodeInput
          onAddressFound={({ prefecture, city, town }) => {
            onUpdate({ address: `${prefecture}${city}${town}` });
            const candidates = findAreasByAddress(prefecture, city);
            if (candidates.length > 0 && !form.area) {
              onUpdate({ area: candidates[0] });
            }
          }}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">
              エリア <span className="text-red-500">*</span>
            </label>
            <AreaSelect
              value={form.area}
              onChange={(v) => {
                onUpdate({ area: v });
                if (!form.address.trim()) {
                  onUpdate({ address: getAreaAddressPrefix(v) });
                }
              }}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">
              住所 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => onUpdate({ address: e.target.value })}
              required
              maxLength={200}
              placeholder="例: 愛知県名古屋市錦2-14-5 ○○ビル3F"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
            <p className="text-xs text-[var(--text-sub)] mt-1">都道府県から番地・ビル名まで入力してください</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">
              最寄駅
            </label>
            <input
              type="text"
              value={form.nearestStation}
              onChange={(e) => onUpdate({ nearestStation: e.target.value })}
              maxLength={50}
              placeholder="例: 栄駅"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">
              徒歩（分）
            </label>
            <input
              type="number"
              value={form.walkMinutes ?? ""}
              onChange={(e) => onUpdate({ walkMinutes: e.target.value ? Number(e.target.value) : null })}
              min={1}
              max={60}
              placeholder="例: 5"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">
            店舗紹介文
          </label>
          <textarea
            value={form.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            rows={4}
            maxLength={2000}
            placeholder="お店の雰囲気や特徴をアピールしましょう..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
          />
          <p className="text-xs text-[var(--text-sub)] mt-1 text-right">{form.description.length} / 2000</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">
              営業時間
            </label>
            <input
              type="text"
              value={form.businessHours}
              onChange={(e) => onUpdate({ businessHours: e.target.value })}
              maxLength={200}
              placeholder="例: 20:00〜LAST（月〜土）"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">
              定休日
            </label>
            <input
              type="text"
              value={form.regularHolidays}
              onChange={(e) => onUpdate({ regularHolidays: e.target.value })}
              maxLength={100}
              placeholder="例: 不定休、日曜定休"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
