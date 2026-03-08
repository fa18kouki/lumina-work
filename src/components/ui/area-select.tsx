"use client";

import { REGION_DATA } from "@/lib/areas";

interface AreaSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * エリア単一選択コンポーネント（select + optgroup）
 * valueにはエリアのlabel（表示名）を使用
 */
export function AreaSelect({
  value,
  onChange,
  placeholder = "選択してください",
  className = "",
}: AreaSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      <option value="">{placeholder}</option>
      {REGION_DATA.map((region) =>
        region.prefectures.map((pref) => (
          <optgroup key={pref.name} label={`${region.name} - ${pref.name}`}>
            {pref.cities?.map((city) =>
              city.areas.map((area) => (
                <option key={area.id} value={area.label}>
                  {"\u3000"}
                  {city.name} / {area.label}
                </option>
              ))
            )}
            {pref.areas?.map((area) => (
              <option key={area.id} value={area.label}>
                {area.label}
              </option>
            ))}
          </optgroup>
        ))
      )}
    </select>
  );
}
