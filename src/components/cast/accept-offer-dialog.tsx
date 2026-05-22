"use client";

import { useState } from "react";
import { CalendarDays, CheckCircle2 } from "lucide-react";

interface AcceptOfferDialogProps {
  open: boolean;
  storeName: string;
  /** 店舗が登録した面接候補日時 (ISO8601)。通常 3 件 */
  interviewSlots: string[];
  isSubmitting: boolean;
  onConfirm: (selectedSlotIndex: number) => void;
  onCancel: () => void;
}

function formatJa(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(d);
}

export function AcceptOfferDialog({
  open,
  storeName,
  interviewSlots,
  isSubmitting,
  onConfirm,
  onCancel,
}: AcceptOfferDialogProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!open) return null;

  const hasSlots = interviewSlots.length > 0;

  const handleConfirm = () => {
    if (selectedIndex === null) return;
    onConfirm(selectedIndex);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 pt-6 pb-4">
          <h3 className="text-lg font-bold text-(--text-main) mb-1">
            面接候補日時を選んで承諾
          </h3>
          <p className="text-sm text-(--text-sub)">
            {storeName} の面接候補から 1 つお選びください。
          </p>
        </div>

        <div className="px-6 pb-4">
          {hasSlots ? (
            <ul className="space-y-2" role="radiogroup" aria-label="面接候補日時">
              {interviewSlots.map((iso, idx) => {
                const selected = idx === selectedIndex;
                return (
                  <li key={idx}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                        selected
                          ? "border-(--primary) bg-(--primary-bg)"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <CalendarDays
                          className={`w-4 h-4 flex-shrink-0 ${
                            selected ? "text-(--primary)" : "text-gray-400"
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            selected
                              ? "text-(--primary) font-semibold"
                              : "text-(--text-main)"
                          }`}
                        >
                          {formatJa(iso)}
                        </span>
                      </div>
                      {selected && (
                        <CheckCircle2 className="w-5 h-5 text-(--primary) flex-shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-800">
                このオファーには面接候補日時が設定されていません。店舗にお問い合わせください。
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-6 py-4 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-(--text-sub) hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedIndex === null || isSubmitting || !hasSlots}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-(--primary) hover:opacity-90 text-white transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "送信中..." : "この日時で承諾する"}
          </button>
        </div>
      </div>
    </div>
  );
}
