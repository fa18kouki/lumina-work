"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  parseCallbackTokens,
  resolveNextPath,
} from "@/lib/cast-login-callback";
import { createBrowserClient } from "@/lib/supabase-auth";

/**
 * キャストの Supabase マジックリンク完了ページ。
 *
 * Supabase メール認証は以下の 2 経路のどちらでも届きうるため、両方を明示処理する:
 *   - implicit flow: URL hash fragment (#access_token=...&refresh_token=...&type=...)
 *   - PKCE flow:     query string (?code=...)
 *
 * `@supabase/ssr` の detectSessionInUrl 自動処理に任せると、useEffect とのレースや
 * フロー切り替え時のセッション欠落が発生する (owner 側 RUN-503 で踏み抜き)。
 * 明示的に setSession / exchangeCodeForSession を呼ぶことで安定させる。
 */
function LoginCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("ログインを確認しています...");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const supabase = createBrowserClient();

      const tokens = parseCallbackTokens({
        hash: typeof window !== "undefined" ? window.location.hash : "",
        searchParams: new URLSearchParams(searchParams.toString()),
      });

      if (tokens.kind === "hash") {
        const { error } = await supabase.auth.setSession({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
        });
        if (cancelled) return;
        if (error) {
          setStatus("error");
          setMessage(
            "認証リンクの有効期限が切れているか、無効です。もう一度お試しください。",
          );
          return;
        }
        // hash を履歴から消す (戻る/リロードでの再処理を防ぐ)
        if (typeof window !== "undefined") {
          window.history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search,
          );
        }
      } else if (tokens.kind === "code") {
        const { error } = await supabase.auth.exchangeCodeForSession(
          tokens.code,
        );
        if (cancelled) return;
        if (error) {
          setStatus("error");
          setMessage(
            "認証コードの検証に失敗しました。もう一度ログインしてください。",
          );
          return;
        }
      } else {
        // tokens.kind === "none": URL に手がかりが無い場合は、既存セッションの有無だけ確認する。
        // (例: タブ復帰でこのページを直接踏んだ場合)
        const { data, error } = await supabase.auth.getSession();
        if (cancelled) return;
        if (error || !data.session) {
          setStatus("error");
          setMessage("セッションがありません。もう一度ログインしてください。");
          return;
        }
      }

      const res = await fetch("/api/auth/sync-cast-user", { method: "POST" });
      if (cancelled) return;

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setStatus("error");
        setMessage(
          (body as { message?: string })?.message ?? "アカウントの同期に失敗しました。",
        );
        return;
      }

      const next = resolveNextPath(searchParams.get("next"));

      setStatus("ok");
      setMessage("ログインしました。リダイレクトしています...");
      router.replace(next);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <div className="flex justify-center mb-6">
        <Image src="/Image.png" alt="LUMINA" width={180} height={54} priority />
      </div>
      {status === "loading" && (
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"
            aria-hidden
          />
          <p className="text-gray-600">{message}</p>
        </div>
      )}
      {status === "ok" && (
        <p className="text-gray-600">{message}</p>
      )}
      {status === "error" && (
        <div className="text-center space-y-4">
          <p className="text-red-600">{message}</p>
          <a
            href="/c/login"
            className="inline-block text-sm text-pink-500 hover:underline"
          >
            ログイン画面に戻る
          </a>
        </div>
      )}
    </div>
  );
}

export default function LoginCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginCallbackContent />
    </Suspense>
  );
}
