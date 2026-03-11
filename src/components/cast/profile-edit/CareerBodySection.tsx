"use client";

import { CUP_SIZES } from "@/lib/constants";

interface LanguageSkills {
  english: string;
  chinese: string;
  other: string;
}

interface Props {
  data: {
    currentOccupation: string;
    height: number | null;
    weight: number | null;
    bust: number | null;
    waist: number | null;
    hip: number | null;
    cupSize: string;
    languageSkills: LanguageSkills;
    cosmeticSurgery: string;
  };
  onChange: (field: string, value: unknown) => void;
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-(--text-main) mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-(--text-main) focus:outline-none focus:ring-2 focus:ring-(--primary)/30 focus:border-(--primary)";

const selectClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-(--text-main) bg-white focus:outline-none focus:ring-2 focus:ring-(--primary)/30 focus:border-(--primary)";

function NumberInput({
  label,
  value,
  onChange,
  unit,
  min,
  max,
  placeholder,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  unit: string;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  return (
    <FormField label={label}>
      <div className="flex items-center gap-2">
        <input
          type="number"
          className={inputClass}
          value={value ?? ""}
          onChange={(e) =>
            onChange(e.target.value ? Number(e.target.value) : null)
          }
          min={min}
          max={max}
          placeholder={placeholder}
        />
        <span className="text-sm text-(--text-sub) whitespace-nowrap">
          {unit}
        </span>
      </div>
    </FormField>
  );
}

export function CareerBodySection({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-(--text-main) border-b border-gray-100 pb-2">
        キャリア情報
      </h3>

      <FormField label="現在の職業">
        <input
          type="text"
          className={inputClass}
          value={data.currentOccupation}
          onChange={(e) => onChange("currentOccupation", e.target.value)}
          placeholder="OL、学生、フリーターなど"
        />
      </FormField>

      <h3 className="text-base font-semibold text-(--text-main) border-b border-gray-100 pb-2 pt-2">
        身体情報
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <NumberInput
          label="身長"
          value={data.height}
          onChange={(v) => onChange("height", v)}
          unit="cm"
          min={100}
          max={250}
          placeholder="165"
        />

        <NumberInput
          label="体重"
          value={data.weight}
          onChange={(v) => onChange("weight", v)}
          unit="kg"
          min={30}
          max={200}
          placeholder="50"
        />

        <NumberInput
          label="バスト"
          value={data.bust}
          onChange={(v) => onChange("bust", v)}
          unit="cm"
          min={50}
          max={150}
        />

        <NumberInput
          label="ウエスト"
          value={data.waist}
          onChange={(v) => onChange("waist", v)}
          unit="cm"
          min={40}
          max={120}
        />

        <NumberInput
          label="ヒップ"
          value={data.hip}
          onChange={(v) => onChange("hip", v)}
          unit="cm"
          min={50}
          max={150}
        />

        <FormField label="カップサイズ">
          <select
            className={selectClass}
            value={data.cupSize}
            onChange={(e) => onChange("cupSize", e.target.value)}
          >
            <option value="">選択</option>
            {CUP_SIZES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <h3 className="text-base font-semibold text-(--text-main) border-b border-gray-100 pb-2 pt-2">
        語学・その他
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="英語">
          <input
            type="text"
            className={inputClass}
            value={data.languageSkills?.english ?? ""}
            onChange={(e) =>
              onChange("languageSkills", {
                ...data.languageSkills,
                english: e.target.value,
              })
            }
            placeholder="日常会話、ビジネスなど"
          />
        </FormField>

        <FormField label="中国語">
          <input
            type="text"
            className={inputClass}
            value={data.languageSkills?.chinese ?? ""}
            onChange={(e) =>
              onChange("languageSkills", {
                ...data.languageSkills,
                chinese: e.target.value,
              })
            }
          />
        </FormField>

        <FormField label="その他の言語">
          <input
            type="text"
            className={inputClass}
            value={data.languageSkills?.other ?? ""}
            onChange={(e) =>
              onChange("languageSkills", {
                ...data.languageSkills,
                other: e.target.value,
              })
            }
          />
        </FormField>
      </div>

      <FormField label="整形歴">
        <textarea
          className={`${inputClass} min-h-[60px]`}
          value={data.cosmeticSurgery}
          onChange={(e) => onChange("cosmeticSurgery", e.target.value)}
          placeholder="なし / 目・鼻など"
        />
      </FormField>
    </div>
  );
}
