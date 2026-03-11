"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createBrowserClient } from "@/lib/supabase-auth";

/**
 * キャストの Supabase マジックリンク完了ページ。
 * メールのリンクは Supabase 経由でここに hash 付きでリダイレクトされる。
 * セッションを復元したあと Prisma User を同期し、next パラメータの先へ遷移する（無ければ /c/dashboard）。
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
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (cancelled) return;
      if (sessionError) {
        setStatus("error");
        setMessage("セッションの取得に失敗しました。");
        return;
      }
      if (!session) {
        setStatus("error");
        setMessage("セッションがありません。もう一度ログインしてください。");
        return;
      }

      const res = await fetch("/api/auth/sync-cast-user", { method: "POST" });
      if (cancelled) return;

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setStatus("error");
        setMessage(
          (body as { message?: string })?.message ?? "アカウントの同期に失敗しました。"
        );
        return;
      }

      const nextRaw = searchParams.get("next");
      const next =
        nextRaw && nextRaw.startsWith("/") ? decodeURIComponent(nextRaw) : "/c/dashboard";

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
