"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase-auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) return;

    setIsLoading(true);
    try {
      const supabase = createBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/s/reset-password`,
        }
      );

      if (resetError) {
        setError("メールの送信に失敗しました。もう一度お試しください");
        return;
      }

      setEmailSent(true);
    } catch {
      setError("エラーが発生しました。もう一度お試しください");
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
          <h1 className="text-2xl font-bold text-gray-900">パスワードリセット</h1>
          <p className="mt-2 text-gray-600">
            登録済みのメールアドレスを入力してください
          </p>
        </div>

        <div className="mt-8">
          {emailSent ? (
            <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg text-center space-y-2">
              <p className="text-blue-800 font-medium text-lg">
                リセットメールを送信しました
              </p>
              <p className="text-blue-600 text-sm">
                {email} に送信されたリンクからパスワードを再設定してください
              </p>
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

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full flex items-center justify-center gap-2 px-4 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
              >
                {isLoading ? "送信中..." : "リセットメールを送信"}
              </button>
            </form>
          )}
        </div>

        <div className="text-center">
          <Link
            href="/s/login"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ログインに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
