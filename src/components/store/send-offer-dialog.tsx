"use client";

import { useMemo, useState } from "react";
import { X, Send, AlertCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

interface SendOfferDialogProps {
  open: boolean;
  storeId: string;
  castId: string | null;
  castNickname: string;
  onClose: () => void;
  onSuccess: () => void;
}

const SLOT_COUNT = 3;

/**
 * datetime-local の "YYYY-MM-DDTHH:mm" (ローカルタイム) を ISO8601 (UTC) に変換。
 * 空文字は null を返し、validation 側で「未入力」として扱う。
 */
function localInputToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * 「明日 19:00」を datetime-local の初期値として返すユーティリティ。
 * インデックスごとに +24h ずつずらして 3 枠を埋める下敷きにする。
 */
function defaultSlotLocal(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(19, 0, 0, 0);
  // toISOString は UTC なので、ローカル時刻 → "YYYY-MM-DDTHH:mm" を手で組む。
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SendOfferDialog({
  open,
  storeId,
  castId,
  castNickname,
  onClose,
  onSuccess,
}: SendOfferDialogProps) {
  const [message, setMessage] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [slots, setSlots] = useState<string[]>(() => [
    defaultSlotLocal(1),
    defaultSlotLocal(2),
    defaultSlotLocal(3),
  ]);
  const [showConfirm, setShowConfirm] = useState(false);

  const sendOffer = trpc.store.sendOffer.useMutation({
    onSuccess: () => {
      setMessage("");
      setExpiresInDays(7);
      setSlots([defaultSlotLocal(1), defaultSlotLocal(2), defaultSlotLocal(3)]);
      setShowConfirm(false);
      onSuccess();
    },
  });

  // datetime-local の min: 今 (これより前は disabled に近づける)
  const nowLocalMin = useMemo(() => defaultSlotLocal(0).slice(0, 16), []);

  const slotIsoOrNull = slots.map(localInputToIso);
  const allSlotsFilled = slotIsoOrNull.every((v): v is string => v !== null);
  const allSlotsFuture = slotIsoOrNull.every(
    (v) => v !== null && new Date(v).getTime() > Date.now(),
  );
  const slotsUnique =
    new Set(slotIsoOrNull.filter((v): v is string => v !== null)).size ===
    SLOT_COUNT;

  const slotValidationError = !allSlotsFilled
    ? "面接候補日時を 3 つすべて入力してください"
    : !allSlotsFuture
      ? "面接候補日時は現在より未来の日時を指定してください"
      : !slotsUnique
        ? "面接候補日時は重複しないようにしてください"
        : null;

  if (!open || !castId) return null;

  const handleSubmit = () => {
    if (slotValidationError) {
      setShowConfirm(false);
      return;
    }
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    if (!allSlotsFilled) return;
    sendOffer.mutate({
      storeId,
      castId,
      message,
      expiresInDays,
      interviewSlots: slotIsoOrNull as string[],
    });
  };

  const handleClose = () => {
    setShowConfirm(false);
    sendOffer.reset();
    onClose();
  };

  const updateSlot = (idx: number, value: string) => {
    setSlots((prev) => prev.map((v, i) => (i === idx ? value : v)));
    setShowConfirm(false);
  };

  const submitDisabled =
    message.length === 0 ||
    sendOffer.isPending ||
    !!slotValidationError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="text-lg font-bold text-[var(--text-main)]">
            オファーを送信
          </h3>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* 送信先 */}
          <div>
            <p className="text-sm text-[var(--text-sub)] mb-1">送信先</p>
            <p className="font-medium text-[var(--text-main)]">{castNickname}</p>
          </div>

          {/* メッセージ */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">
              メッセージ <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="お店の魅力やオファー内容を記入してください..."
              rows={5}
              maxLength={1000}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
            />
            <p className="text-xs text-[var(--text-sub)] mt-1 text-right">
              {message.length} / 1000
            </p>
          </div>

          {/* 面接候補日時 */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-4 h-4 text-[var(--text-sub)]" />
              <label className="block text-sm font-medium text-[var(--text-main)]">
                面接候補日時 <span className="text-red-500">*</span>
                <span className="text-xs text-[var(--text-sub)] font-normal ml-1">
                  （3 つ必須）
                </span>
              </label>
            </div>
            <p className="text-xs text-[var(--text-sub)] mb-2">
              キャストはこの中から 1 つを選んで承諾します。
            </p>
            <div className="space-y-2">
              {slots.map((value, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-sub)] w-6 flex-shrink-0">
                    {idx + 1}.
                  </span>
                  <input
                    type="datetime-local"
                    value={value}
                    min={nowLocalMin}
                    onChange={(e) => updateSlot(idx, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    aria-label={`面接候補日時 ${idx + 1}`}
                  />
                </div>
              ))}
            </div>
            {slotValidationError && (
              <p className="text-xs text-amber-700 mt-1.5">
                {slotValidationError}
              </p>
            )}
          </div>

          {/* 有効期限 */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">
              有効期限
            </label>
            <select
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value={3}>3日間</option>
              <option value={7}>7日間</option>
              <option value={14}>14日間</option>
              <option value={30}>30日間</option>
            </select>
          </div>

          {/* エラー */}
          {sendOffer.error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{sendOffer.error.message}</p>
            </div>
          )}

          {/* 確認メッセージ */}
          {showConfirm && !sendOffer.error && !slotValidationError && (
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-800 font-medium">
                {castNickname}さんにオファーを送信します。よろしいですか？
              </p>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="border-t border-gray-100 px-6 py-4 flex gap-3 sticky bottom-0 bg-white">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            キャンセル
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitDisabled}
            className="flex-1"
          >
            {sendOffer.isPending ? (
              "送信中..."
            ) : showConfirm ? (
              <>
                <Send className="w-4 h-4 mr-1" />
                送信する
              </>
            ) : (
              "確認へ"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
