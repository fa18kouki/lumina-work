"use client";

import { useRouter } from "next/navigation";
import { DiagnosisProvider } from "@/lib/diagnosis/diagnosis-context";
import { DiagnosisChatContainer } from "@/components/diagnosis/DiagnosisChatContainer";

export default function AIDiagnosisPage() {
  const router = useRouter();

  const handleComplete = () => {
    // 診断完了後は店舗検索ページへ遷移
    router.push("/c/stores");
  };

  return (
    <DiagnosisProvider>
      <div className="flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-80px)]">
        {/* ヘッダー */}
        <div className="px-4 py-3 sm:px-6 sm:py-4">
          <h1 className="text-xl font-bold text-white sm:text-2xl">AI診断</h1>
          <p className="text-sm text-gray-400 mt-1">
            チャット形式であなたのプロフィールを作成します
          </p>
        </div>

        {/* チャットコンテナ */}
        <div className="flex-1 px-4 pb-4 sm:px-6 sm:pb-6 min-h-0">
          <DiagnosisChatContainer
            className="h-full"
            onComplete={handleComplete}
          />
        </div>
      </div>
    </DiagnosisProvider>
  );
}
