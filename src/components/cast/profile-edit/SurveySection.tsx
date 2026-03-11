"use client";

interface Props {
  data: {
    birthdayEventWillingness: boolean | null;
    photoPublicationConsent: boolean | null;
    familyApproval: boolean | null;
  };
  onChange: (field: string, value: unknown) => void;
}

function BooleanQuestion({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-sm font-medium text-(--text-main) mb-1">{label}</p>
      {description && (
        <p className="text-xs text-(--text-sub) mb-3">{description}</p>
      )}
      <div className="flex gap-3">
        {[
          { v: true, l: "はい" },
          { v: false, l: "いいえ" },
        ].map((opt) => (
          <button
            key={String(opt.v)}
            type="button"
            onClick={() => onChange(value === opt.v ? null : opt.v)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
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

export function SurveySection({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-(--text-main) border-b border-gray-100 pb-2">
        業務アンケート
      </h3>

      <div className="space-y-4">
        <BooleanQuestion
          label="バースデーイベントへの参加意思はありますか？"
          description="店舗でのバースデーイベント開催について"
          value={data.birthdayEventWillingness}
          onChange={(v) => onChange("birthdayEventWillingness", v)}
        />

        <BooleanQuestion
          label="写真の掲載に同意しますか？"
          description="店舗のWebサイトやSNSでの写真掲載について"
          value={data.photoPublicationConsent}
          onChange={(v) => onChange("photoPublicationConsent", v)}
        />

        <BooleanQuestion
          label="ご家族にお仕事のことを伝えていますか？"
          description="ナイトワークに従事することについて"
          value={data.familyApproval}
          onChange={(v) => onChange("familyApproval", v)}
        />
      </div>
    </div>
  );
}
