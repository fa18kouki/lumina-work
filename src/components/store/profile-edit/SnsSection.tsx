"use client";

import type { SnsLinks } from "@/lib/types/store";
import type { SectionProps } from "./types";

export function SnsSection({ form, onUpdate }: SectionProps) {
  const links = form.snsLinks ?? { instagram: "", twitter: "" };

  const updateLinks = (partial: Partial<SnsLinks>) => {
    onUpdate({ snsLinks: { ...links, ...partial } });
  };

  return (
    <section className="bg-white rounded-xl border border-gray-100 p-6">
      <h2 className="text-base font-bold text-[var(--text-main)] mb-4">SNS</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">Instagram</label>
          <input
            type="text"
            value={links.instagram ?? ""}
            onChange={(e) => updateLinks({ instagram: e.target.value })}
            maxLength={200}
            placeholder="例: https://instagram.com/yourstore"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">X（Twitter）</label>
          <input
            type="text"
            value={links.twitter ?? ""}
            onChange={(e) => updateLinks({ twitter: e.target.value })}
            maxLength={200}
            placeholder="例: https://x.com/yourstore"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
      </div>
    </section>
  );
}
