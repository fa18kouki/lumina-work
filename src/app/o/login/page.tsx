"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase-auth";
import { ownerLoginErrorMessage } from "@/app/o/login/error-message";

export default function OwnerLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    }>
      <OwnerLoginForm />
    </Suspense>
  );
}

function OwnerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/o/dashboard";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(ownerLoginErrorMessage(urlError));
  const [recovering, setRecovering] = useState(false);

  // Supabase の招待 / マジックリンク / パスワード復旧リンクは implicit flow で
  // access_token を URL fragment (#access_token=...&type=invite) に載せて戻ってくる。
  // サーバ側 /api/auth/callback は ?code= (PKCE) しか読めないため一度 missing_code
  // に弾かれ、30x リダイレクトでこのページに hash 付きで辿り着くケースを救う。
  // 同じ仕組みで Supabase から直接 /o/login に着地したケースも処理する。
  useEffect(() => {
    if (typeof window === "undefined") return;
    const rawHash = window.location.hash;
    if (!rawHash.includes("access_token")) return;

    const params = new URLSearchParams(
      rawHash.startsWith("#") ? rawHash.slice(1) : rawHash,
    );
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const linkType = params.get("type");

    if (!accessToken || !refreshToken) return;

    let cancelled = false;
    setError("");
    setRecovering(true);

    (async () => {
      try {
        const supabase = createBrowserClient();
        const { error: setErr } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (setErr) {
          if (!cancelled) {
            setError(
              "認証リンクの有効期限が切れているか、無効です。もう一度お試しください",
            );
            setRecovering(false);
          }
          return;
        }

        // hash と error= クエリを履歴から消す (戻る / リロードでの再処理防止)
        window.history.replaceState(null, "", window.location.pathname);

        // type=recovery (パスワード再設定) は専用画面へ。
        // session は setSession 済なので reset-password で updateUser が通る。
        if (linkType === "recovery") {
          if (!cancelled) router.push("/o/reset-password");
          return;
        }

        // 通常の invite / signup / magiclink は owner provisioning を回して dashboard へ。
        // mode=invite で「未存在なら新規作成」を許可する (招待リンクは admin が許諾済の意図表明)。
        const syncRes = await fetch("/api/auth/sync-owner-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "invite" }),
        });
        if (!syncRes.ok) {
          if (!cancelled) {
            if (syncRes.status === 409) {
              setError(
                "このメールアドレスは既に別のアカウントに紐付いています。サポートにお問い合わせください",
              );
            } else if (syncRes.status === 410) {
              setError(
                "このアカウントは退会済みです。再度ご利用される場合は新規登録をお願いします",
              );
            } else {
              setError("ログインに失敗しました。もう一度お試しください");
            }
            setRecovering(false);
          }
          return;
        }

        if (cancelled) return;
        router.push(callbackUrl);
        router.refresh();
      } catch {
        if (!cancelled) {
          setError("認証に失敗しました。もう一度お試しください");
          setRecovering(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [callbackUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) return;

    setIsLoading(true);
    try {
      const supabase = createBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError("メールアドレスまたはパスワードが間違っています");
        return;
      }

      // mode=login: 未登録メールでの auto-create を許可しない (security)。
      const syncRes = await fetch("/api/auth/sync-owner-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "login" }),
      });

      if (!syncRes.ok) {
        // 取得した Supabase セッションは「中途半端な認証状態」になるため破棄する。
        // 残しておくと middleware は通すのに /o/layout がリダイレクトに回す状態が続く。
        await supabase.auth.signOut().catch(() => {
          // sign-out 失敗は表示エラーで観測されるので無視する
        });

        if (syncRes.status === 404) {
          setError(
            "このメールアドレスは登録されていません。新規登録から始めてください",
          );
        } else if (syncRes.status === 409) {
          setError(
            "このメールアドレスは既に別のアカウントに紐付いています。サポートにお問い合わせください",
          );
        } else if (syncRes.status === 410) {
          setError(
            "このアカウントは退会済みです。再度ご利用される場合は新規登録をお願いします",
          );
        } else {
          setError("ログインに失敗しました。もう一度お試しください");
        }
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("ログインに失敗しました。もう一度お試しください");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <Image src="/Image.png" alt="LUMINA" width={200} height={60} priority />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">オーナーログイン</h1>
          <p className="mt-2 text-gray-600">
            メールアドレスとパスワードでログインします
          </p>
        </div>

        <div className="mt-8">
          {recovering ? (
            <div className="text-center py-12">
              <p className="text-gray-700">招待を確認しています...</p>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワードを入力"
                  required
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full flex items-center justify-center gap-3 px-4 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
            >
              {isLoading ? "ログイン中..." : "ログイン"}
            </button>
          </form>
          )}
        </div>

        <div className="text-center space-y-2">
          <div>
            <Link href="/o/forgot-password" className="text-sm text-gray-500 hover:text-gray-700">
              パスワードをお忘れですか？
            </Link>
          </div>
          <div>
            <span className="text-sm text-gray-600">アカウントをお持ちでない方は</span>{" "}
            <Link href="/o/register" className="text-sm text-slate-700 font-semibold">
              新規登録
            </Link>
          </div>
          <div>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              トップページに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
