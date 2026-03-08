"use client";

import { Input } from "@/components/ui/input";

export type SalaryData = {
  hourlyRateMin: number;
  hourlyRateMax: number;
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

type SalaryInputProps = {
  value: SalaryData;
  onChange: (value: SalaryData) => void;
};

type RangeRowProps = {
  label: string;
  unit: string;
  unitSuffix?: string;
  minValue: number | undefined;
  maxValue: number | undefined;
  onMinChange: (v: number | undefined) => void;
  onMaxChange: (v: number | undefined) => void;
  required?: boolean;
  step?: number;
  placeholder?: { min: string; max: string };
};

function RangeRow({
  label,
  unit,
  unitSuffix,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  required,
  step = 1000,
  placeholder,
}: RangeRowProps) {
  const parseValue = (raw: string): number | undefined => {
    if (raw === "") return undefined;
    const n = Number(raw);
    return isNaN(n) ? undefined : n;
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-(--text-main)">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            type="number"
            inputMode="numeric"
            value={minValue ?? ""}
            onChange={(e) => onMinChange(parseValue(e.target.value))}
            placeholder={placeholder?.min ?? "下限"}
            step={step}
            min={0}
            required={required}
            className="pr-8"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-(--text-sub) pointer-events-none">
            {unit}
          </span>
        </div>
        <span className="text-(--text-sub) text-sm shrink-0">〜</span>
        <div className="relative flex-1">
          <Input
            type="number"
            inputMode="numeric"
            value={maxValue ?? ""}
            onChange={(e) => onMaxChange(parseValue(e.target.value))}
            placeholder={placeholder?.max ?? "上限"}
            step={step}
            min={0}
            required={required}
            className="pr-8"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-(--text-sub) pointer-events-none">
            {unit}
          </span>
        </div>
        {unitSuffix && (
          <span className="text-xs text-(--text-sub) shrink-0 w-10">
            {unitSuffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function SalaryInput({ value, onChange }: SalaryInputProps) {
  const update = (partial: Partial<SalaryData>) => {
    onChange({ ...value, ...partial });
  };

  return (
    <div className="space-y-5">
      {/* 時給（必須） */}
      <RangeRow
        label="時給"
        unit="円"
        minValue={value.hourlyRateMin || undefined}
        maxValue={value.hourlyRateMax || undefined}
        onMinChange={(v) => update({ hourlyRateMin: v ?? 0 })}
        onMaxChange={(v) => update({ hourlyRateMax: v ?? 0 })}
        required
        step={1000}
        placeholder={{ min: "例: 3000", max: "例: 10000" }}
      />

      {/* 各種バック（任意） */}
      <div className="border-t border-gray-200 pt-4">
        <p className="text-sm text-(--text-sub) mb-3">
          各種バック（任意）
        </p>
        <div className="space-y-4">
          <RangeRow
            label="同伴バック"
            unit="円"
            unitSuffix="/回"
            minValue={value.companionBackMin}
            maxValue={value.companionBackMax}
            onMinChange={(v) => update({ companionBackMin: v })}
            onMaxChange={(v) => update({ companionBackMax: v })}
            step={500}
            placeholder={{ min: "例: 2000", max: "例: 5000" }}
          />

          <RangeRow
            label="ドリンクバック"
            unit="円"
            unitSuffix="/杯"
            minValue={value.drinkBackMin}
            maxValue={value.drinkBackMax}
            onMinChange={(v) => update({ drinkBackMin: v })}
            onMaxChange={(v) => update({ drinkBackMax: v })}
            step={100}
            placeholder={{ min: "例: 300", max: "例: 1000" }}
          />

          <RangeRow
            label="本指名バック"
            unit="円"
            unitSuffix="/本"
            minValue={value.nominationBackMin}
            maxValue={value.nominationBackMax}
            onMinChange={(v) => update({ nominationBackMin: v })}
            onMaxChange={(v) => update({ nominationBackMax: v })}
            step={500}
            placeholder={{ min: "例: 1000", max: "例: 3000" }}
          />

          <RangeRow
            label="場内指名バック"
            unit="円"
            unitSuffix="/本"
            minValue={value.floorNominationBackMin}
            maxValue={value.floorNominationBackMax}
            onMinChange={(v) => update({ floorNominationBackMin: v })}
            onMaxChange={(v) => update({ floorNominationBackMax: v })}
            step={100}
            placeholder={{ min: "例: 500", max: "例: 1500" }}
          />

          <RangeRow
            label="売上バック"
            unit="%"
            minValue={value.salesBackMinPercent}
            maxValue={value.salesBackMaxPercent}
            onMinChange={(v) => update({ salesBackMinPercent: v })}
            onMaxChange={(v) => update({ salesBackMaxPercent: v })}
            step={1}
            placeholder={{ min: "例: 10", max: "例: 30" }}
          />
        </div>
      </div>
    </div>
  );
}
