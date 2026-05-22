"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Gift } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/lib/toast-provider";

export default function OwnerRegisterPage() {
  return (
    <Suspense>
      <OwnerRegisterForm />
    </Suspense>
  );
}

function OwnerRegisterForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") ?? "");
  const [showPassword, setShowPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");
  const { addToast } = useToast();
  const utils = trpc.useUtils();

  // signup フローはサーバで Supabase Auth リンク発行 + Resend SDK 送信を行う。
  // テンプレ管理 / Supabase Email Templates 依存の排除のため client から
  // supabase.auth.signUp() を直接叩かない。詳細: docs/email-architecture.md。
  const requestSignup = trpc.ownerAuth.requestSignup.useMutation();

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

    try {
      // requestSignup の前に DB 側の重複チェック (招待中 / 既登録) を行う。
      // ownerAuth.requestSignup は Supabase のエラーメッセージを文字列マッチ
      // で CONFLICT 化しているだけで「招待中」と「自己登録済み」を区別できない
      // ため、ここで誘導文言を出し分けるための preflight を挟む。
      const preflight = await utils.client.auth.preflightOwnerSignup.query({
        email,
      });
      if (!preflight.ok) {
        if (preflight.reason === "PENDING_INVITATION") {
          setError(
            "このメールアドレスは管理者から招待されています。受信した招待メールのリンクから登録を完了してください。",
          );
        } else if (preflight.reason === "ALREADY_REGISTERED") {
          setError(
            "このメールアドレスはすでにオーナーとして登録されています。ログイン画面からサインインしてください。",
          );
        } else {
          setError(
            "このメールアドレスは別の役割で登録されているため、オーナーとして登録できません。",
          );
        }
        return;
      }

      await requestSignup.mutateAsync({
        email,
        password,
        referralCode: referralCode.trim() || undefined,
      });
      setEmailSent(true);
    } catch (err) {
      // tRPC mutation の TRPCError は err.data.code に乗ってくる
      const code = (err as { data?: { code?: string } } | undefined)?.data?.code;
      const message =
        err instanceof Error
          ? err.message
          : "登録に失敗しました。もう一度お試しください";
      if (code === "CONFLICT") {
        // preflight で取りこぼした race (preflight 〜 mutation 間に他で登録が
        // 走った場合) の防御線。文言は preflight と整合させる。
        setError(
          "このメールアドレスはすでに登録されています。ログイン画面からサインインしてください。",
        );
        return;
      }
      addToast("error", message);
    }
  };

  const isLoading = requestSignup.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <Image src="/Image.png" alt="LUMINA" width={200} height={60} priority />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">オーナーアカウント登録</h1>
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
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
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

              <div>
                <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 mb-1">
                  紹介コード（お持ちの方）
                </label>
                <div className="relative">
                  <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="referralCode"
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="LUMINA-XXXXXX"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-colors text-sm uppercase"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email || !password || !confirmPassword}
                className="w-full flex items-center justify-center gap-2 px-4 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
              >
                {isLoading ? "登録中..." : "アカウントを登録"}
              </button>
            </form>
          )}
        </div>

        <div className="text-center space-y-2">
          <div>
            <span className="text-sm text-gray-600">すでにアカウントをお持ちですか？</span>{" "}
            <Link href="/o/login" className="text-sm text-slate-700 font-semibold">
              ログイン
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
