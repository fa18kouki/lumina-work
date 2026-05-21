"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (busy) return;
    setBusy(true);
    let serverLogoutOk = true;
    try {
      const res = await fetch("/api/admin/auth", {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) {
        serverLogoutOk = false;
        console.error(
          `[AdminLogoutButton] Server logout returned ${res.status}; cookie may persist on the server.`,
        );
      }
    } catch (err) {
      // ネットワーク失敗。サーバ側 cookie はおそらく残る。
      // クライアント側はログイン画面に戻すが、サーバ側で再度ログインさせる必要がある旨を残す。
      serverLogoutOk = false;
      console.error("[AdminLogoutButton] Logout request failed", err);
    } finally {
      // 失敗時もブラウザでは /login に戻す (ユーザ視点で「ログアウト押した」事実は尊重)。
      // ただし serverLogoutOk=false の場合、cookie がまだサーバ側で valid な状態のため、
      // 攻撃者がブラウザを物理的に奪った場合は再ログイン無しで /invites に戻れる
      // (admin-session HMAC の expiresAt まで)。次の本格対応は session 失効リスト。
      router.replace("/login");
      router.refresh();
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
    >
      {busy ? "..." : "ログアウト"}
    </button>
  );
}
