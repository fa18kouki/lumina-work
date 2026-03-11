"use client";

import {
  LIVING_OPTIONS,
  TRANSPORT_OPTIONS,
  DRESS_OPTIONS,
} from "@/lib/constants";

interface Props {
  data: {
    livingArrangement: string;
    transportation: string;
    needsPickup: boolean | null;
    hasTattoo: boolean | null;
    dressAvailability: string;
    hasBoyfriend: boolean | null;
    hasHusband: boolean | null;
    hasChildren: boolean | null;
  };
  onChange: (field: string, value: unknown) => void;
}

function OptionGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-(--text-main) mb-2">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value === value ? "" : opt.value)}
            className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
              value === opt.value
                ? "bg-(--primary) text-white border-(--primary)"
                : "bg-white text-(--text-main) border-gray-200 hover:border-(--primary)/50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function BooleanGroup({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-(--text-main) mb-2">
        {label}
      </label>
      <div className="flex gap-2">
        {[
          { v: true, l: "はい" },
          { v: false, l: "いいえ" },
        ].map((opt) => (
          <button
            key={String(opt.v)}
            type="button"
            onClick={() => onChange(value === opt.v ? null : opt.v)}
            className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
              value === opt.v
                ? "bg-(--primary) text-white border-(--primary)"
                : "bg-white text-(--text-main) border-gray-200 hover:border-(--primary)/50"
            }`}
          >
            {opt.l}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AttributeSection({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-(--text-main) border-b border-gray-100 pb-2">
        属性・ライフスタイル
      </h3>

      <div className="space-y-5">
        <OptionGroup
          label="居住形態"
          options={LIVING_OPTIONS}
          value={data.livingArrangement}
          onChange={(v) => onChange("livingArrangement", v)}
        />

        <OptionGroup
          label="交通手段"
          options={TRANSPORT_OPTIONS}
          value={data.transportation}
          onChange={(v) => onChange("transportation", v)}
        />

        <BooleanGroup
          label="送迎が必要"
          value={data.needsPickup}
          onChange={(v) => onChange("needsPickup", v)}
        />

        <BooleanGroup
          label="タトゥー"
          value={data.hasTattoo}
          onChange={(v) => onChange("hasTattoo", v)}
        />

        <OptionGroup
          label="ドレス"
          options={DRESS_OPTIONS}
          value={data.dressAvailability}
          onChange={(v) => onChange("dressAvailability", v)}
        />

        <BooleanGroup
          label="彼氏がいる"
          value={data.hasBoyfriend}
          onChange={(v) => onChange("hasBoyfriend", v)}
        />

        <BooleanGroup
          label="既婚"
          value={data.hasHusband}
          onChange={(v) => onChange("hasHusband", v)}
        />

        <BooleanGroup
          label="お子さんがいる"
          value={data.hasChildren}
          onChange={(v) => onChange("hasChildren", v)}
        />
      </div>
    </div>
  );
}
