"use client";

import { useState } from "react";

import { trpc } from "@/lib/trpc";

const PLAN_OPTIONS = [
  { value: "FREE", label: "フリー" },
  { value: "CASUAL", label: "カジュアル" },
  { value: "PRO_TRIAL", label: "プロ" },
  { value: "PRO_BUSINESS", label: "プロ ビジネス" },
  { value: "PRO_ENTERPRISE", label: "プロ エンタープライズ" },
] as const;

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "ACTIVE (利用可)" },
  { value: "PAST_DUE", label: "PAST_DUE (未払い)" },
  { value: "CANCELLED", label: "CANCELLED (解約)" },
  { value: "INCOMPLETE", label: "INCOMPLETE (未完了)" },
] as const;

type Plan = (typeof PLAN_OPTIONS)[number]["value"];
type Status = (typeof STATUS_OPTIONS)[number]["value"];

interface Props {
  target: {
    userId: string;
    email: string | null;
    companyName: string | null;
    currentPlan: string;
    currentStatus: string;
    offerLimit: number | null;
    maxStores: number | null;
  };
  onClose: () => void;
  onSaved: () => void;
}

export function AdminSubscriptionEditModal({ target, onClose, onSaved }: Props) {
  const [plan, setPlan] = useState<Plan>(target.currentPlan as Plan);
  const [status, setStatus] = useState<Status>(target.currentStatus as Status);
  const [note, setNote] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const changePlan = trpc.adminPanel.subscriptions.changePlan.useMutation({
    onSuccess: () => {
      onSaved();
    },
    onError: (err) => {
      setErrorMessage(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    changePlan.mutate({
      userId: target.userId,
      plan,
      status,
      note: note.trim() || undefined,
    });
  };

  const isDirty =
    plan !== target.currentPlan ||
    status !== target.currentStatus ||
    note.trim().length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscription-edit-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h3
          id="subscription-edit-title"
          className="text-lg font-semibold text-slate-900"
        >
          プラン変更
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          {target.companyName ? `${target.companyName} / ` : ""}
          {target.email ?? "(email 未設定)"}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="plan-select"
              className="block text-xs font-medium text-slate-700"
            >
              プラン
            </label>
            <select
              id="plan-select"
              value={plan}
              onChange={(e) => setPlan(e.target.value as Plan)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              {PLAN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="status-select"
              className="block text-xs font-medium text-slate-700"
            >
              ステータス
            </label>
            <select
              id="status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="note-input"
              className="block text-xs font-medium text-slate-700"
            >
              メモ (任意 / 監査ログに残ります)
            </label>
            <textarea
              id="note-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="例: 2026-05-22 電話確認、契約書受領済"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>

          {errorMessage ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!isDirty || changePlan.isPending}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {changePlan.isPending ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
