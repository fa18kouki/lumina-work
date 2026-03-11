"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase-auth";

export default function StoreRegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return;
    }
    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createBrowserClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/s/dashboard`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError("このメールアドレスは既に登録されています");
        } else {
          setError("登録に失敗しました。もう一度お試しください");
        }
        return;
      }

      setEmailSent(true);
    } catch {
      setError("登録に失敗しました。もう一度お試しください");
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
          <h1 className="text-2xl font-bold text-gray-900">店舗アカウント登録</h1>
          <p className="mt-2 text-gray-600">
            メールアドレスとパスワードで登録します
          </p>
        </div>

        <div className="mt-8">
          {emailSent ? (
            <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg text-center space-y-2">
              <p className="text-blue-800 font-medium text-lg">
                確認メールを送信しました
              </p>
              <p className="text-blue-600 text-sm">
                {email} に送信されたリンクをクリックして登録を完了してください
              </p>
              <button
                type="button"
                onClick={() => {
                  setEmailSent(false);
                  setError("");
                }}
                className="text-sm text-blue-700 hover:underline mt-2"
              >
                別のメールアドレスで登録する
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
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
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  パスワード
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8文字以上"
                    required
                    minLength={8}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-colors text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  パスワード（確認）
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="パスワードを再入力"
                    required
                    minLength={8}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-colors text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email || !password || !confirmPassword}
                className="w-full flex items-center justify-center gap-2 px-4 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    登録中...
                  </span>
                ) : (
                  "アカウントを登録"
                )}
              </button>
            </form>
          )}
        </div>

        <div className="text-center space-y-2">
          <div>
            <span className="text-sm text-gray-600">すでにアカウントをお持ちですか？</span>{" "}
            <Link
              href="/s/login"
              className="text-sm text-slate-700 font-semibold"
            >
              ログイン
            </Link>
          </div>
          <div>
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              トップページに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
