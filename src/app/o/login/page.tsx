"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase-auth";

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
  const [error, setError] = useState(
    urlError === "auth_failed" ? "認証に失敗しました。もう一度お試しください" : ""
  );

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

      const syncRes = await fetch("/api/auth/sync-owner-user", { method: "POST" });

      if (!syncRes.ok) {
        if (syncRes.status === 409) {
          setError("このメールアドレスは既に別のアカウントに紐付いています。サポートにお問い合わせください");
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
