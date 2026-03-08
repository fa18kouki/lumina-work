"use client";

import { Instagram, MessageCircle, Link } from "lucide-react";
import type { ProfileFormData } from "../ProfileWizard";

interface ContactStepProps {
  data: ProfileFormData;
  onDataChange: (data: Partial<ProfileFormData>) => void;
}

export function ContactStep({ data, onDataChange }: ContactStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-lg font-bold text-gray-900">連絡先</h2>
        <p className="text-sm text-gray-500">
          店舗との連絡手段として使用されます
        </p>
      </div>

      <div className="rounded-lg bg-pink-50 p-4">
        <p className="text-sm text-pink-700">
          システムは仲介しません。応募後は当事者間で直接やり取りしていただきます。
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
            <Instagram className="h-4 w-4" />
            Instagram ID
          </label>
          <div className="flex items-center">
            <span className="rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 py-3 text-gray-500">
              @
            </span>
            <input
              type="text"
              value={data.instagramId || ""}
              onChange={(e) => onDataChange({ instagramId: e.target.value })}
              placeholder="your_instagram_id"
              maxLength={30}
              className="w-full rounded-r-lg border border-gray-300 px-4 py-3 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
            <MessageCircle className="h-4 w-4" />
            LINE ID
          </label>
          <input
            type="text"
            value={data.lineId || ""}
            onChange={(e) => onDataChange({ lineId: e.target.value })}
            placeholder="友だち追加用のLINE ID"
            maxLength={50}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            友だち追加してもらうためのIDです
          </p>
        </div>

        <div>
          <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
            <Link className="h-4 w-4" />
            在籍URL
          </label>
          <input
            type="url"
            value={data.currentListingUrl || ""}
            onChange={(e) => onDataChange({ currentListingUrl: e.target.value })}
            placeholder="https://example.com/profile/xxx"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            情報サイトのプロフィールURL（お店ジャンル、口コミなどの参考になります）
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        すべて任意項目です。入力しない場合はスキップできます。
      </p>
    </div>
  );
}
