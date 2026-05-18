"use client";

import { useState } from "react";

import { trpc } from "@/lib/trpc";

export function AdminInviteCreateForm() {
  const utils = trpc.useUtils();
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState<
    { kind: "success" | "error"; message: string } | null
  >(null);

  const createMutation = trpc.adminPanel.invite.create.useMutation({
    onSuccess: async (data) => {
      setFeedback({
        kind: "success",
        message: `${data.email} に招待メールを送信しました`,
      });
      setEmail("");
      await utils.adminPanel.invite.list.invalidate();
    },
    onError: (err) => {
      setFeedback({ kind: "error", message: err.message });
    },
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || createMutation.isPending) return;
    setFeedback(null);
    createMutation.mutate({ email: email.trim() });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h3 className="text-sm font-semibold text-slate-800">新規招待</h3>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          autoComplete="off"
          placeholder="invitee@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={createMutation.isPending}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
        <button
          type="submit"
          disabled={createMutation.isPending || !email.trim()}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createMutation.isPending ? "送信中..." : "招待を送る"}
        </button>
      </div>
      {feedback ? (
        <p
          className={`text-sm ${feedback.kind === "success" ? "text-emerald-700" : "text-red-600"}`}
          role="status"
        >
          {feedback.message}
        </p>
      ) : null}
    </form>
  );
}
