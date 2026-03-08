"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense } from "react";
import { useDiagnosis } from "@/lib/diagnosis-provider";

function LoginContent() {
  const searchParams = useSearchParams();
  const { session: diagnosisSession } = useDiagnosis();

  // 診断経由かどうか
  const diagnosisId = searchParams.get("diagnosisId");
  const fromDiagnosisParam = searchParams.get("fromDiagnosis");
  const fromDiagnosis = Boolean(diagnosisId || fromDiagnosisParam || diagnosisSession?.result);

  const callbackUrl = fromDiagnosis ? "/ai-diagnosis" : "/dashboard";

  const handleLogin = () => {
    signIn("line", { callbackUrl });
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
                LINE登録で、希望条件を満たす店舗の詳細を確認できます
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900">キャストログイン</h1>
              <p className="mt-2 text-gray-500">
                LINEアカウントでログインしてご利用ください
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

        {/* LINEログインボタン */}
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
