"use client";

import { useState } from "react";

import { trpc } from "@/lib/trpc";

const PLAN_OPTIONS = [
  { value: "FREE", label: "FREE" },
  { value: "CASUAL", label: "CASUAL" },
  { value: "PRO_TRIAL", label: "PRO_TRIAL" },
  { value: "PRO_BUSINESS", label: "PRO_BUSINESS" },
  { value: "PRO_ENTERPRISE", label: "PRO_ENTERPRISE" },
] as const;

export function AdminDirectOwnerCreateForm() {
  const utils = trpc.useUtils();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [plan, setPlan] = useState<(typeof PLAN_OPTIONS)[number]["value"]>("FREE");
  const [customMonthlyPriceJpy, setCustomMonthlyPriceJpy] = useState("");
  const [createdMessage, setCreatedMessage] = useState<string | null>(null);

  const mutation = trpc.adminPanel.invite.createDirectOwner.useMutation({
    onSuccess: async (result) => {
      setCreatedMessage(
        `${result.email ?? email} をオーナーとして作成しました。仮パスワードを安全な方法で共有してください。`,
      );
      setEmail("");
      setPassword("");
      setCompanyName("");
      setRepresentativeName("");
      setPlan("FREE");
      setCustomMonthlyPriceJpy("");
      await Promise.all([
        utils.adminPanel.invite.list.invalidate(),
        utils.adminPanel.subscriptions.list.invalidate(),
      ]);
    },
  });

  return (
    <form
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        setCreatedMessage(null);
        mutation.mutate({
          email,
          password,
          companyName: companyName || undefined,
          representativeName: representativeName || undefined,
          plan,
          customMonthlyPriceJpy:
            customMonthlyPriceJpy === "" ? undefined : Number(customMonthlyPriceJpy),
        });
      }}
    >
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">
          管理者がオーナーアカウントを直接作成
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          仮メールアドレス・仮パスワードで先にログイン可能にします。オーナー本人はログイン後に設定画面で変更できます。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-slate-700">
          ログインメール
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="owner@example.com"
          />
        </label>
        <label className="space-y-1 text-sm font-medium text-slate-700">
          仮パスワード
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="8文字以上"
          />
        </label>
        <label className="space-y-1 text-sm font-medium text-slate-700">
          会社名 / 店舗運営会社
          <input
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="株式会社〇〇"
          />
        </label>
        <label className="space-y-1 text-sm font-medium text-slate-700">
          担当者名
          <input
            value={representativeName}
            onChange={(event) => setRepresentativeName(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="山田 太郎"
          />
        </label>
        <label className="space-y-1 text-sm font-medium text-slate-700">
          初期プラン
          <select
            value={plan}
            onChange={(event) =>
              setPlan(event.target.value as (typeof PLAN_OPTIONS)[number]["value"])
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {PLAN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium text-slate-700">
          個別月額（税込/円）
          <input
            type="number"
            min={0}
            step={1}
            value={customMonthlyPriceJpy}
            onChange={(event) => setCustomMonthlyPriceJpy(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="未入力ならプラン標準価格"
          />
        </label>
      </div>

      {mutation.error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {mutation.error.message}
        </p>
      )}
      {createdMessage && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {createdMessage}
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {mutation.isPending ? "作成中..." : "オーナーを直接作成"}
        </button>
      </div>
    </form>
  );
}
