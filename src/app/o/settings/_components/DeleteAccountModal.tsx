"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-auth";

interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
  hasPaidPlan: boolean;
}

export function DeleteAccountModal({
  open,
  onClose,
  hasPaidPlan,
}: DeleteAccountModalProps) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const deleteAccount = trpc.owner.deleteAccount.useMutation({
    onSuccess: async () => {
      try {
        // Supabase クライアント側からも sign out して残った session を破棄
        const supabase = createBrowserClient();
        await supabase.auth.signOut();
      } catch {
        // signOut 失敗は致命的ではない
      }
      router.replace("/o/login?error=account_deleted");
    },
    onError: (err) => {
      setErrorMessage(err.message ?? "退会処理に失敗しました");
    },
  });

  if (!open) return null;

  const canSubmit = confirmText === "DELETE" && agreed && !deleteAccount.isPending;

  const handleSubmit = () => {
    setErrorMessage(null);
    deleteAccount.mutate({ confirmText: "DELETE" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-red-700 mb-2">
          アカウントを削除しますか？
        </h3>
        <p className="text-sm text-[var(--text-sub)] mb-4 leading-relaxed">
          この操作を行うとアカウントが退会扱いとなり、登録した店舗情報・応募履歴が
          すべて非公開になります。同じメールアドレスでの再登録は将来的に可能ですが、
          削除されたデータの復元は管理運営側で対応します。
        </p>

        {hasPaidPlan && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-amber-800 leading-relaxed">
              <span className="font-bold">⚠ 有料プランをご利用中です。</span>
              退会と同時に Stripe サブスクリプションを即時キャンセルします。
              月額料金の日割り返金はありません。
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
              確認のため、半角大文字で <code className="px-1.5 py-0.5 bg-gray-100 rounded text-red-600 font-mono">DELETE</code> と入力してください
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
              autoFocus
            />
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-red-600"
            />
            <span className="text-sm text-[var(--text-main)] leading-relaxed">
              退会後の店舗情報非公開と、{hasPaidPlan ? "Stripe サブスクの即時キャンセル" : "プラン解約"}に同意します
            </span>
          </label>

          {errorMessage && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={deleteAccount.isPending}
            className="px-4 py-2 text-sm text-[var(--text-main)] hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {deleteAccount.isPending ? "退会処理中..." : "退会する"}
          </button>
        </div>
      </div>
    </div>
  );
}
