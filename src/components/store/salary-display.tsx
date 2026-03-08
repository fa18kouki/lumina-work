"use client";

import { DollarSign } from "lucide-react";

type SalaryDisplayData = {
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  companionBackMin?: number;
  companionBackMax?: number;
  drinkBackMin?: number;
  drinkBackMax?: number;
  nominationBackMin?: number;
  nominationBackMax?: number;
  floorNominationBackMin?: number;
  floorNominationBackMax?: number;
  salesBackMinPercent?: number;
  salesBackMaxPercent?: number;
};

function formatRange(min?: number, max?: number, unit = "円", suffix?: string): string | null {
  if (!min && !max) return null;
  const parts: string[] = [];
  if (min) parts.push(`${min.toLocaleString()}${unit}`);
  if (max && max !== min) {
    parts.push(`${max.toLocaleString()}${unit}`);
    return parts.join("〜") + (suffix ? ` ${suffix}` : "");
  }
  return parts[0] + (suffix ? ` ${suffix}` : "");
}

export function SalaryDisplay({ data }: { data: Record<string, number> | null | undefined }) {
  if (!data) return null;

  const d = data as unknown as SalaryDisplayData;
  const hourly = formatRange(d.hourlyRateMin, d.hourlyRateMax);

  const backs = [
    { label: "同伴バック", value: formatRange(d.companionBackMin, d.companionBackMax, "円", "/回") },
    { label: "ドリンクバック", value: formatRange(d.drinkBackMin, d.drinkBackMax, "円", "/杯") },
    { label: "本指名バック", value: formatRange(d.nominationBackMin, d.nominationBackMax, "円", "/本") },
    { label: "場内指名バック", value: formatRange(d.floorNominationBackMin, d.floorNominationBackMax, "円", "/本") },
    { label: "売上バック", value: formatRange(d.salesBackMinPercent, d.salesBackMaxPercent, "%") },
  ].filter((b) => b.value);

  return (
    <div className="space-y-2 text-sm text-(--text-main)">
      {hourly && (
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-slate-700" />
          <span className="font-medium">時給 {hourly}</span>
        </div>
      )}
      {backs.length > 0 && (
        <div className="pl-6 space-y-1">
          {backs.map((b) => (
            <div key={b.label} className="flex items-center gap-2 text-(--text-sub)">
              <span>{b.label}:</span>
              <span className="text-(--text-main)">{b.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
