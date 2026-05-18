"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!apiKey.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ apiKey }),
        credentials: "same-origin",
      });
      if (res.status === 401) {
        setError("API キーが一致しません");
        return;
      }
      if (res.status === 503) {
        setError(
          "サーバーで ADMIN_API_KEY が設定されていません。管理者に連絡してください。",
        );
        return;
      }
      if (!res.ok) {
        setError(`ログインに失敗しました (HTTP ${res.status})`);
        return;
      }
      router.replace("/invites");
      router.refresh();
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">ADMIN_API_KEY</span>
        <input
          type="password"
          autoComplete="current-password"
          autoFocus
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          placeholder="API キーを貼り付け"
          disabled={submitting}
        />
      </label>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting || !apiKey.trim()}
        className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "確認中..." : "ログイン"}
      </button>
    </form>
  );
}
