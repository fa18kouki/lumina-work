"use client";

import { useState } from "react";
import { X, Send, AlertCircle } from "lucide-react";
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
  const [showConfirm, setShowConfirm] = useState(false);

  const sendOffer = trpc.store.sendOffer.useMutation({
    onSuccess: () => {
      setMessage("");
      setExpiresInDays(7);
      setShowConfirm(false);
      onSuccess();
    },
  });

  if (!open || !castId) return null;

  const handleSubmit = () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    sendOffer.mutate({
      storeId,
      castId,
      message,
      expiresInDays,
    });
  };

  const handleClose = () => {
    setShowConfirm(false);
    sendOffer.reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
        {/* ヘッダー */}
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
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
          {showConfirm && !sendOffer.error && (
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-800 font-medium">
                {castNickname}さんにオファーを送信します。よろしいですか？
              </p>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="border-t border-gray-100 px-6 py-4 flex gap-3">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            キャンセル
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={message.length === 0 || sendOffer.isPending}
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
