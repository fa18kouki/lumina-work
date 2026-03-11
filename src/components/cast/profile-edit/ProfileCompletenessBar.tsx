"use client";

import type { ProfileCompleteness } from "@/lib/profile-completeness";

interface Props {
  completeness: ProfileCompleteness;
}

function getBarColor(percent: number): string {
  if (percent >= 80) return "bg-green-500";
  if (percent >= 50) return "bg-yellow-500";
  return "bg-(--primary)";
}

export function ProfileCompletenessBar({ completeness }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-(--text-main)">
          プロフィール充実度
        </span>
        <span className="text-2xl font-bold text-(--primary)">
          {completeness.totalPercent}%
        </span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-3 mb-3">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${getBarColor(completeness.totalPercent)}`}
          style={{ width: `${completeness.totalPercent}%` }}
        />
      </div>

      <p className="text-xs text-(--text-sub) mb-4">
        プロフィールが充実しているほどオファーが来やすくなります
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {completeness.categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center gap-2 text-xs"
          >
            <div className="w-full bg-gray-100 rounded-full h-1.5 flex-1">
              <div
                className={`h-1.5 rounded-full ${getBarColor(cat.percent)}`}
                style={{ width: `${cat.percent}%` }}
              />
            </div>
            <span className="text-(--text-sub) whitespace-nowrap min-w-[4rem]">
              {cat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
