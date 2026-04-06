"use client";

import { X } from "lucide-react";
import { ATMOSPHERE_TAG_OPTIONS } from "@/lib/constants";
import type { SectionProps } from "./types";

export function AppealSection({ form, onUpdate }: SectionProps) {
  const toggleTag = (tag: string) => {
    const tags = form.atmosphereTags.includes(tag)
      ? form.atmosphereTags.filter((t) => t !== tag)
      : form.atmosphereTags.length < 10
        ? [...form.atmosphereTags, tag]
        : form.atmosphereTags;
    onUpdate({ atmosphereTags: tags });
  };

  const removeTag = (tag: string) => {
    onUpdate({ atmosphereTags: form.atmosphereTags.filter((t) => t !== tag) });
  };

  return (
    <section className="bg-white rounded-xl border border-gray-100 p-6">
      <h2 className="text-base font-bold text-[var(--text-main)] mb-4">店舗の魅力</h2>
      <div className="space-y-4">
        {/* 雰囲気タグ */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
            雰囲気タグ <span className="text-xs text-[var(--text-sub)] font-normal">（最大10個）</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {ATMOSPHERE_TAG_OPTIONS.map((tag) => {
              const selected = form.atmosphereTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    selected
                      ? "bg-slate-700 text-white border-slate-700"
                      : "bg-white text-slate-600 border-gray-200 hover:border-slate-300"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          {form.atmosphereTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {form.atmosphereTags.filter((t) => !ATMOSPHERE_TAG_OPTIONS.includes(t as typeof ATMOSPHERE_TAG_OPTIONS[number])).map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 text-slate-700 text-xs rounded-lg">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">在籍キャスト数</label>
            <input
              type="number"
              value={form.castCount ?? ""}
              onChange={(e) => onUpdate({ castCount: e.target.value ? Number(e.target.value) : null })}
              min={0}
              max={1000}
              placeholder="例: 30"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">客層</label>
            <input
              type="text"
              value={form.clientele}
              onChange={(e) => onUpdate({ clientele: e.target.value })}
              maxLength={500}
              placeholder="例: 30〜50代のビジネスマンが中心"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">スタッフ紹介・メッセージ</label>
          <textarea
            value={form.staffIntroduction}
            onChange={(e) => onUpdate({ staffIntroduction: e.target.value })}
            rows={4}
            maxLength={2000}
            placeholder="スタッフからのメッセージやお店の魅力を伝えましょう..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
          />
          <p className="text-xs text-[var(--text-sub)] mt-1 text-right">{form.staffIntroduction.length} / 2000</p>
        </div>
      </div>
    </section>
  );
}
