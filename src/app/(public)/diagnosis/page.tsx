"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  DiagnosisChat,
  StepIndicator,
  type ChatMessage,
  type ChatOption,
} from "@/components/diagnosis/DiagnosisChat";
import { AreaSelector } from "@/components/ui/area-selector";
import {
  ChatImagePicker,
  type SelectedImage,
} from "@/components/chat/ChatImagePicker";
import { useDiagnosis } from "@/lib/diagnosis-provider";
import type { DiagnosisAnswers } from "@/lib/diagnosis-session";
import { Loader2 } from "lucide-react";

// 質問定義
interface Question {
  id: keyof DiagnosisAnswers | string;
  content: string;
  options: ChatOption[];
  followUp?: (answer: string) => string;
}

const QUESTIONS: Question[] = [
  {
    id: "greeting",
    content:
      "こんにちは！LUMINA AI面接へようこそ\n\nこれからいくつか質問させていただきます。\n回答をもとに診断結果を出し、条件に合うお店をご紹介します。\n\nさっそく始めましょう！",
    options: [{ id: "start", label: "診断をはじめる", value: "start" }],
  },
  {
    id: "age",
    content: "年齢を教えてください",
    options: [
      { id: "18-20", label: "18〜20歳", value: "19" },
      { id: "21-23", label: "21〜23歳", value: "22" },
      { id: "24-26", label: "24〜26歳", value: "25" },
      { id: "27-29", label: "27〜29歳", value: "28" },
      { id: "30-32", label: "30〜32歳", value: "31" },
      { id: "33-35", label: "33〜35歳", value: "34" },
      { id: "36+", label: "36歳以上", value: "36" },
    ],
    followUp: () => "ありがとうございます！",
  },
  {
    id: "totalExperienceYears",
    content: "夜職の経験はありますか？",
    options: [
      { id: "0", label: "未経験", value: "0" },
      { id: "0.5", label: "1年未満", value: "0.5" },
      { id: "2", label: "1〜3年", value: "2" },
      { id: "5", label: "3年以上", value: "5" },
    ],
    followUp: (answer) => {
      if (answer === "0") return "未経験なんですね！初めてでも安心のお店をご紹介しますね";
      if (answer === "5") return "経験豊富ですね！高時給のお店をご紹介できそうです";
      return "なるほど、ありがとうございます！";
    },
  },
  {
    id: "desiredAreas",
    content: "働きたいエリアはどこですか？\n（複数選択できます）",
    options: [],
    followUp: (answer) => `${answer}ですね！`,
  },
  {
    id: "desiredHourlyRate",
    content: "希望の時給を教えてください\n（1,000円単位で入力できます）",
    options: [],
    followUp: (answer) => `${Number(answer).toLocaleString()}円以上ですね！`,
  },
  {
    id: "availableDaysPerWeek",
    content: "週に何日くらい働きたいですか？",
    options: [
      { id: "1", label: "週1〜2日", value: "1.5" },
      { id: "3", label: "週3日", value: "3" },
      { id: "4", label: "週4〜5日", value: "4.5" },
      { id: "6", label: "週6日以上", value: "6" },
    ],
    followUp: () => "了解しました！",
  },
  {
    id: "alcoholTolerance",
    content: "お酒の強さを教えてください",
    options: [
      { id: "none", label: "飲めない", value: "NONE" },
      { id: "weak", label: "弱い", value: "WEAK" },
      { id: "moderate", label: "普通", value: "MODERATE" },
      { id: "strong", label: "強い", value: "STRONG" },
    ],
    followUp: () => "了解しました！",
  },
  {
    id: "preferredAtmosphere",
    content: "希望のお店の雰囲気は？",
    options: [
      { id: "calm", label: "落ち着いた店", value: "落ち着いた店" },
      { id: "lively", label: "ワイワイ系", value: "ワイワイ系" },
      { id: "elegant", label: "高級感のある店", value: "高級感のある店" },
      { id: "casual", label: "カジュアル", value: "カジュアルな店" },
    ],
    followUp: () => "あなたに合ったお店を探しますね！",
  },
  {
    id: "strengths",
    content: "あなたの強みは？",
    options: [
      { id: "communication", label: "コミュ力", value: "コミュニケーション力" },
      { id: "appearance", label: "容姿", value: "容姿" },
      { id: "experience", label: "接客経験", value: "接客経験" },
      { id: "personality", label: "明るい性格", value: "明るい性格" },
    ],
    followUp: () => "素敵ですね！",
  },
  {
    id: "facePhotos",
    content:
      "最後に、お顔の写真をアップロードしてください\n（最大5枚まで。お店への応募時に使用されます）",
    options: [],
    followUp: () =>
      "ありがとうございます！\n\nこれで診断に必要な情報が揃いました！\n結果を計算しています...",
  },
];

export default function DiagnosisPage() {
  const router = useRouter();
  const { session, startDiagnosis, addAnswers, completeInterview } =
    useDiagnosis();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState(3000);
  const [faceImages, setFaceImages] = useState<SelectedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // ポップアップ同意後に初期化
  const handleAgree = useCallback(() => {
    setShowDisclaimer(false);
    startDiagnosis();

    const firstQuestion = QUESTIONS[0];
    setTimeout(() => {
      setMessages([
        {
          id: `ai-${Date.now()}`,
          type: "ai",
          content: firstQuestion.content,
          options: firstQuestion.options,
          timestamp: new Date(),
        },
      ]);
      setIsInitialized(true);
    }, 500);
  }, [startDiagnosis]);

  // エリア選択確定
  const handleAreaConfirm = useCallback(() => {
    if (selectedAreas.length === 0) return;

    const currentQuestion = QUESTIONS[currentQuestionIndex];
    const areaLabel = selectedAreas.join("、");

    // ユーザーの回答をメッセージに追加
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        type: "user",
        content: areaLabel,
        timestamp: new Date(),
      },
    ]);

    // 回答を保存
    addAnswers({ desiredAreas: selectedAreas });

    // 次の質問へ
    const nextIndex = currentQuestionIndex + 1;
    setSelectedAreas([]);

    if (nextIndex < QUESTIONS.length) {
      setIsTyping(true);
      setTimeout(() => {
        const followUp = currentQuestion.followUp?.(areaLabel);
        if (followUp) {
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-followup-${Date.now()}`,
              type: "ai",
              content: followUp,
              timestamp: new Date(),
            },
          ]);
        }
        setTimeout(() => {
          const nextQuestion = QUESTIONS[nextIndex];
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              type: "ai",
              content: nextQuestion.content,
              options: nextQuestion.options,
              timestamp: new Date(),
            },
          ]);
          setCurrentQuestionIndex(nextIndex);
          setIsTyping(false);
        }, 800);
      }, 600);
    }
  }, [selectedAreas, currentQuestionIndex, addAnswers]);

  // 時給入力確定
  const handleHourlyRateConfirm = useCallback(() => {
    if (hourlyRate < 1000) return;

    const currentQuestion = QUESTIONS[currentQuestionIndex];
    const rateStr = String(hourlyRate);
    const rateLabel = `${hourlyRate.toLocaleString()}円以上`;

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        type: "user",
        content: rateLabel,
        timestamp: new Date(),
      },
    ]);

    addAnswers({ desiredHourlyRate: hourlyRate });

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < QUESTIONS.length) {
      setIsTyping(true);
      setTimeout(() => {
        const followUp = currentQuestion.followUp?.(rateStr);
        if (followUp) {
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-followup-${Date.now()}`,
              type: "ai",
              content: followUp,
              timestamp: new Date(),
            },
          ]);
        }
        setTimeout(() => {
          const nextQuestion = QUESTIONS[nextIndex];
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              type: "ai",
              content: nextQuestion.content,
              options: nextQuestion.options,
              timestamp: new Date(),
            },
          ]);
          setCurrentQuestionIndex(nextIndex);
          setIsTyping(false);
        }, 800);
      }, 600);
    }
  }, [hourlyRate, currentQuestionIndex, addAnswers]);

  // 顔写真アップロード確定
  const handleFacePhotoConfirm = useCallback(async () => {
    if (faceImages.length === 0 || !session) return;

    const currentQuestion = QUESTIONS[currentQuestionIndex];

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        type: "user",
        content: `写真${faceImages.length}枚を選択しました`,
        timestamp: new Date(),
      },
    ]);

    setIsUploading(true);
    setIsTyping(true);

    try {
      let urls: string[] = [];

      // Supabase未設定時はアップロードをスキップしてローカルURLを使用
      const supabaseConfigured =
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseConfigured) {
        for (const img of faceImages) {
          const fileExt =
            img.file.name.split(".").pop()?.toLowerCase() || "jpg";

          const response = await fetch("/api/upload/diagnosis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: session.id, fileExt }),
          });

          if (!response.ok) {
            throw new Error("アップロードURLの取得に失敗しました");
          }

          const { signedUrl, publicUrl } = await response.json();

          const uploadResponse = await fetch(signedUrl, {
            method: "PUT",
            headers: { "Content-Type": img.file.type },
            body: img.file,
          });

          if (!uploadResponse.ok) {
            throw new Error("画像のアップロードに失敗しました");
          }

          urls.push(publicUrl);
        }
      } else {
        // デモモード: ローカルプレビューURLを使用
        urls = faceImages.map((img) => URL.createObjectURL(img.file));
      }

      addAnswers({ photos: urls });

      const followUp = currentQuestion.followUp?.("");
      if (followUp) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-followup-${Date.now()}`,
            type: "ai",
            content: followUp,
            timestamp: new Date(),
          },
        ]);
      }

      completeInterview();

      setTimeout(() => {
        setIsTyping(false);
        setIsUploading(false);
        router.push("/diagnosis/result");
      }, 2000);
    } catch (error) {
      console.error("Face photo upload error:", error);
      setIsTyping(false);
      setIsUploading(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-error-${Date.now()}`,
          type: "ai",
          content:
            "写真のアップロードに失敗しました。もう一度お試しください。",
          timestamp: new Date(),
        },
      ]);
    }
  }, [
    faceImages,
    session,
    currentQuestionIndex,
    addAnswers,
    completeInterview,
    router,
  ]);

  // 選択肢クリック時の処理
  const handleSelectOption = useCallback(
    (option: ChatOption) => {
      const currentQuestion = QUESTIONS[currentQuestionIndex];

      // ユーザーの回答をメッセージに追加
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          type: "user",
          content: option.label,
          timestamp: new Date(),
        },
      ]);

      // 回答を保存（greeting以外）
      if (currentQuestion.id === "greeting") {
        // 挨拶は保存しない
      } else if (currentQuestion.id === "strengths") {
        addAnswers({ strengths: [option.value] });
      } else if (currentQuestion.id === "desiredAreas") {
        addAnswers({ desiredAreas: [option.value] });
      } else if (currentQuestion.id === "preferredAtmosphere") {
        addAnswers({ preferredAtmosphere: [option.value] });
      } else {
        const answerKey = currentQuestion.id as keyof DiagnosisAnswers;
        addAnswers({ [answerKey]: parseFloat(option.value) || option.value });
      }

      // 次の質問へ
      const nextIndex = currentQuestionIndex + 1;

      if (nextIndex < QUESTIONS.length) {
        // フォローアップメッセージと次の質問
        setIsTyping(true);

        setTimeout(() => {
          const followUp = currentQuestion.followUp?.(option.value);
          if (followUp) {
            setMessages((prev) => [
              ...prev,
              {
                id: `ai-followup-${Date.now()}`,
                type: "ai",
                content: followUp,
                timestamp: new Date(),
              },
            ]);
          }

          setTimeout(() => {
            const nextQuestion = QUESTIONS[nextIndex];
            setMessages((prev) => [
              ...prev,
              {
                id: `ai-${Date.now()}`,
                type: "ai",
                content: nextQuestion.content,
                options: nextQuestion.options,
                timestamp: new Date(),
              },
            ]);
            setCurrentQuestionIndex(nextIndex);
            setIsTyping(false);
          }, 800);
        }, 600);
      } else {
        // 診断完了
        setIsTyping(true);

        setTimeout(() => {
          const followUp = currentQuestion.followUp?.(option.value);
          if (followUp) {
            setMessages((prev) => [
              ...prev,
              {
                id: `ai-followup-${Date.now()}`,
                type: "ai",
                content: followUp,
                timestamp: new Date(),
              },
            ]);
          }

          // 結果を計算
          completeInterview();

          setTimeout(() => {
            setIsTyping(false);
            // 結果ページへ遷移
            router.push("/diagnosis/result");
          }, 2000);
        }, 600);
      }
    },
    [currentQuestionIndex, addAnswers, completeInterview, router]
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 個人情報取扱い同意ポップアップ */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <h2 className="text-gray-900 text-lg font-bold text-center mb-1">
              個人情報の取り扱いについて
            </h2>
            <p className="text-gray-500 text-xs text-center mb-4">
              LUMINA AI診断をご利用いただくにあたり、以下の内容をご確認ください。
            </p>

            {/* スクロール可能な本文エリア */}
            <div className="flex-1 overflow-y-auto bg-gray-50 rounded-xl p-4 mb-4 text-sm leading-relaxed text-gray-600 space-y-4 min-h-0">
              <p>
                当社は、ご提供いただく個人情報を以下の通り取り扱います。内容をご確認いただき、ご同意いただける場合は「同意する」にチェックをお願いいたします。
              </p>

              <div>
                <h3 className="text-gray-900 font-semibold mb-1">1. 個人情報の利用目的</h3>
                <p>当社は、取得した個人情報を以下の目的のために利用いたします。</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-gray-500">
                  <li>お問い合わせ、ご相談への対応および回答のため</li>
                  <li>LUMINA の提供および運営のため</li>
                  <li>AI診断によるお店の情報提供のため</li>
                  <li>新サービス、キャンペーン等に関する情報提供のため</li>
                </ul>
              </div>

              <div>
                <h3 className="text-gray-900 font-semibold mb-1">2. 個人情報の第三者提供</h3>
                <p>当社は、法令に基づく場合を除き、ご本人の同意なく個人情報を第三者に提供することはありません。</p>
              </div>

              <div>
                <h3 className="text-gray-900 font-semibold mb-1">3. 個人情報の委託</h3>
                <p>個人情報の取り扱い業務の全部または一部を外部に委託する場合があります。その場合は、当社の選定基準を満たす委託先を選定し、適切な監督を行います。</p>
              </div>

              <div>
                <h3 className="text-gray-900 font-semibold mb-1">4. 個人情報の開示・訂正・削除</h3>
                <p>ご本人から個人情報の開示、訂正、利用停止、削除等の請求があった場合は、本人確認の上、速やかに対応いたします。下記の「お問い合わせ窓口」までご連絡ください。</p>
              </div>

              <div>
                <h3 className="text-gray-900 font-semibold mb-1">5. 情報提供の任意性</h3>
                <p>個人情報の提供は任意ですが、必要な情報をご提供いただけない場合、各サービスやお問い合わせへの回答が適切に行えない場合があります。</p>
              </div>
            </div>

            {/* ご利用条件 */}
            <div className="bg-pink-50 rounded-xl p-3 mb-4 border border-pink-100">
              <p className="text-gray-900 text-sm font-semibold mb-1">【ご利用条件】</p>
              <ul className="text-gray-600 text-xs space-y-0.5">
                <li>・18歳以上（高校生不可）</li>
                <li>・個人情報の取得に同意いただける方</li>
              </ul>
            </div>

            {/* 同意チェックボックス */}
            <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 bg-white text-pink-500 focus:ring-pink-500 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-gray-700 text-sm">
                上記内容に同意する
              </span>
            </label>

            {/* ボタン */}
            <button
              type="button"
              onClick={handleAgree}
              disabled={!agreed}
              className="w-full py-3 rounded-xl bg-pink-500 text-white font-bold text-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-pink-600"
            >
              同意して診断をはじめる
            </button>
            <Link
              href="/"
              className="block text-center text-gray-400 text-xs mt-3 hover:text-gray-600 transition-colors"
            >
              トップページに戻る
            </Link>
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <Image src="/Image.png" alt="LUMINA" width={120} height={36} priority />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/c/login"
              className="text-xs text-pink-500 hover:text-pink-600 transition-colors"
            >
              ログイン済みの方はこちら
            </Link>
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              登録不要・30秒で診断
            </span>
          </div>
        </div>
      </header>

      {/* 進捗バー */}
      <div className="bg-white px-4 py-3">
        <div className="max-w-lg mx-auto">
          <StepIndicator
            currentStep={Math.min(currentQuestionIndex + 1, QUESTIONS.length)}
            totalSteps={QUESTIONS.length}
          />
        </div>
      </div>

      {/* チャットエリア */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-4">
        <DiagnosisChat
          messages={messages}
          onSelectOption={handleSelectOption}
          isTyping={isTyping}
          className="h-[calc(100vh-180px)]"
          renderCustomInput={
            QUESTIONS[currentQuestionIndex]?.id === "desiredAreas" && !isTyping
              ? () => (
                  <div className="space-y-3">
                    <AreaSelector
                      value={selectedAreas}
                      onChange={setSelectedAreas}
                      className="max-h-[50vh]"
                    />
                    <button
                      type="button"
                      onClick={handleAreaConfirm}
                      disabled={selectedAreas.length === 0}
                      className="w-full py-2.5 rounded-xl bg-pink-500 text-white font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-pink-600"
                    >
                      {selectedAreas.length > 0
                        ? `${selectedAreas.length}件のエリアを選択して次へ`
                        : "エリアを選択してください"}
                    </button>
                  </div>
                )
              : QUESTIONS[currentQuestionIndex]?.id === "facePhotos" && !isTyping
                ? () => (
                    <div className="space-y-3">
                      <ChatImagePicker
                        images={faceImages}
                        onImagesChange={setFaceImages}
                        disabled={isUploading}
                      />
                      <button
                        type="button"
                        onClick={handleFacePhotoConfirm}
                        disabled={faceImages.length === 0 || isUploading}
                        className="w-full py-2.5 rounded-xl bg-pink-500 text-white font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-pink-600 flex items-center justify-center gap-2"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            アップロード中...
                          </>
                        ) : faceImages.length > 0 ? (
                          `${faceImages.length}枚の写真をアップロードして診断する`
                        ) : (
                          "写真を選択してください"
                        )}
                      </button>
                    </div>
                  )
                : QUESTIONS[currentQuestionIndex]?.id === "desiredHourlyRate" && !isTyping
                ? () => (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setHourlyRate((v) => Math.max(1000, v - 1000))}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg font-bold text-gray-600 active:bg-gray-200"
                          >
                            −
                          </button>
                          <div className="flex items-baseline gap-1">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={hourlyRate.toLocaleString()}
                              onChange={(e) => {
                                const num = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10);
                                if (!isNaN(num)) setHourlyRate(Math.round(num / 1000) * 1000);
                              }}
                              className="w-24 text-center text-2xl font-bold text-gray-900 border-b-2 border-pink-300 bg-transparent focus:border-pink-500 focus:outline-none"
                            />
                            <span className="text-sm text-gray-500">円以上</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setHourlyRate((v) => Math.min(30000, v + 1000))}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg font-bold text-gray-600 active:bg-gray-200"
                          >
                            ＋
                          </button>
                        </div>
                        {/* クイック選択ボタン */}
                        <div className="mt-3 flex flex-wrap justify-center gap-2">
                          {[3000, 4000, 5000, 6000, 8000, 10000].map((rate) => (
                            <button
                              key={rate}
                              type="button"
                              onClick={() => setHourlyRate(rate)}
                              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                hourlyRate === rate
                                  ? "bg-pink-500 text-white"
                                  : "bg-gray-100 text-gray-600 active:bg-gray-200"
                              }`}
                            >
                              {rate.toLocaleString()}円
                            </button>
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleHourlyRateConfirm}
                        disabled={hourlyRate < 1000}
                        className="w-full py-2.5 rounded-xl bg-pink-500 text-white font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-pink-600"
                      >
                        {hourlyRate.toLocaleString()}円以上で決定
                      </button>
                    </div>
                  )
                : undefined
          }
        />
      </main>
    </div>
  );
}
