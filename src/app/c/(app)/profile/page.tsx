"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSession } from "@/lib/auth-helpers";
import { useDiagnosis } from "@/lib/diagnosis-provider";
import { trpc } from "@/lib/trpc";
import { Spinner } from "@/components/ui/spinner";

export default function CastProfilePage() {
  const router = useRouter();
  const { data: session, status } = useAppSession();
  const { session: diagnosisSession, clearSession } = useDiagnosis();
  const { data: profile, isLoading } = trpc.cast.getProfile.useQuery();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/c/login");
    else if (session && session.user.role !== "CAST") router.push("/c/login");
  }, [session, status, router]);

  // プロフィール登録済みの場合は詳細編集ページへリダイレクト
  useEffect(() => {
    if (profile) {
      router.replace("/c/profile/edit");
    }
  }, [profile, router]);

  if (status === "loading" || !session || session.user.role !== "CAST" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  const diagnosisResult = diagnosisSession?.result;

  const handleProceed = () => {
    // RUN-248: 診断結果を確認した時点でセッションは消費済みにする
    clearSession();
    router.push("/c/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full space-y-6 py-10">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">ようこそ LUMINA へ</h1>
          <p className="text-sm text-gray-500">
            {diagnosisResult
              ? "診断結果が登録に引き継がれました。マイページから店舗を探しましょう。"
              : "登録が完了しました。マイページから店舗を探しましょう。"}
          </p>
        </div>

        {diagnosisResult && (
          <div className="bg-pink-50 rounded-2xl p-5 border border-pink-100 space-y-3">
            <p className="text-gray-700 font-medium text-sm">診断結果サマリー</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs">推定時給</p>
                <p className="text-xl font-bold text-gray-900">
                  {diagnosisResult.estimatedHourlyRate.toLocaleString()}円〜
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-xs">ランク</p>
                <p className="text-xl font-bold text-pink-500">
                  {diagnosisResult.estimatedRank}
                </p>
              </div>
            </div>
            {diagnosisResult.analysis?.recommendation && (
              <p className="text-xs text-gray-600 pt-2 border-t border-pink-100">
                {diagnosisResult.analysis.recommendation}
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleProceed}
          className="w-full px-4 py-4 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-lg shadow-sm transition-colors"
        >
          マイページへ進む
        </button>
      </div>
    </div>
  );
}
