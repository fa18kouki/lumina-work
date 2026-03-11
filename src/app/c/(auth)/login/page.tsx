"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";
import { useDiagnosis } from "@/lib/diagnosis-provider";
import { createBrowserClient } from "@/lib/supabase-auth";

const useSupabaseAuth = () =>
  Boolean(
    typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

function LoginContent() {
  const searchParams = useSearchParams();
  const { session: diagnosisSession } = useDiagnosis();
  const [email, setEmail] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const useSupabase = useSupabaseAuth();

  // 診断経由かどうか
  const diagnosisId = searchParams.get("diagnosisId");
  const fromDiagnosisParam = searchParams.get("fromDiagnosis");
  const fromDiagnosis = Boolean(diagnosisId || fromDiagnosisParam || diagnosisSession?.result);

  const callbackUrl = fromDiagnosis ? "/c/ai-diagnosis" : "/c/dashboard";

  const handleLogin = () => {
    signIn("line", { callbackUrl });
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setEmailError("");
    setIsEmailLoading(true);
    try {
      if (useSupabase) {
        const supabase = createBrowserClient();
        const next = encodeURIComponent(callbackUrl);
        const redirectTo = `${window.location.origin}/c/login/callback?next=${next}`;
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectTo },
        });
        if (error) {
          setEmailError(error.message);
          return;
        }
        setEmailSent(true);
      } else {
        await signIn("nodemailer", {
          email,
          callbackUrl,
          redirect: false,
        });
        setEmailSent(true);
      }
    } catch {
      console.error("Email sign in failed");
      setEmailError("送信に失敗しました。しばらく経ってからお試しください。");
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full space-y-8 p-6">
        {/* ロゴ */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <Image src="/Image.png" alt="LUMINA" width={180} height={54} priority />
          </div>

          {fromDiagnosis ? (
            <>
              <h1 className="text-2xl font-bold text-gray-900">
                店舗情報を確認するには
              </h1>
              <p className="mt-2 text-gray-500">
                LINEまたはメールで登録すると、希望条件を満たす店舗の詳細を確認できます
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900">キャストログイン</h1>
              <p className="mt-2 text-gray-500">
                LINEまたはメールでログインしてご利用ください
              </p>
            </>
          )}
        </div>

        {/* 診断結果サマリー（診断経由の場合） */}
        {fromDiagnosis && diagnosisSession?.result && (
          <div className="bg-pink-50 rounded-2xl p-4 border border-pink-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">あなたの推定時給</p>
                <p className="text-xl font-bold text-gray-900">
                  {diagnosisSession.result.estimatedHourlyRate.toLocaleString()}円〜
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-sm">ランク</p>
                <p className="text-xl font-bold text-pink-500">
                  {diagnosisSession.result.estimatedRank}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ログイン方法 */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl bg-[#00B900] hover:bg-[#00a000] transition-colors text-white font-medium text-lg"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            LINEで{fromDiagnosis ? "登録して続ける" : "ログイン"}
          </button>

          {/* メール登録・ログイン（キャスト・診断経由の両方） */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-400">または</span>
            </div>
          </div>

          {emailSent ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
              <p className="text-green-800 font-medium">メールを送信しました</p>
              <p className="text-green-600 text-sm mt-1">
                {email} に送信されたリンクをクリックして{fromDiagnosis ? "登録" : "ログイン"}してください
              </p>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {emailError && (
                <p className="text-sm text-red-600">{emailError}</p>
              )}
              <div>
                <label
                  htmlFor="cast-login-email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  メールアドレス
                </label>
                <input
                  id="cast-login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isEmailLoading || !email}
                className="w-full px-4 py-3 rounded-xl bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white font-medium transition-colors"
              >
                {isEmailLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
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
                    送信中...
                  </span>
                ) : (
                  fromDiagnosis ? "メールで登録して続ける" : "メールでログイン"
                )}
              </button>
            </form>
          )}

          {/* 注意事項 */}
          <p className="text-center text-xs text-gray-400">
            ログインすることで、
            <Link href="/terms" className="text-pink-500 hover:underline">
              利用規約
            </Link>
            と
            <Link href="/privacy" className="text-pink-500 hover:underline">
              プライバシーポリシー
            </Link>
            に同意したものとみなされます
          </p>
        </div>

        {/* 戻るリンク */}
        <div className="text-center pt-4">
          <Link
            href={fromDiagnosis ? "/diagnosis/result" : "/"}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            {fromDiagnosis ? "診断結果に戻る" : "トップページに戻る"}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
