"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useDiagnosis } from "@/lib/diagnosis/diagnosis-context";
import { QUESTIONS } from "@/lib/diagnosis/question-flow";
import type { QuestionOption, AnswerValue } from "@/lib/diagnosis/types";

// チャットメッセージコンポーネント
function ChatMessage({
  type,
  content,
  options,
  onSelectOption,
  selectedOptionId,
}: {
  type: "ai" | "user";
  content: string;
  options?: QuestionOption[];
  onSelectOption?: (option: QuestionOption) => void;
  selectedOptionId?: string | null;
}) {
  return (
    <div
      className={cn(
        "flex",
        type === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3",
          type === "user"
            ? "bg-pink-500 text-white"
            : "bg-white text-gray-900 border border-gray-200 shadow-sm"
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>

        {options && options.length > 0 && onSelectOption && (
          <div className="mt-3 flex flex-wrap gap-2">
            {options.map((option) => {
              const isSelected = selectedOptionId === option.id;
              const isDisabled = selectedOptionId !== null;

              return (
                <button
                  key={option.id}
                  onClick={() => onSelectOption(option)}
                  disabled={isDisabled}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                    isSelected
                      ? "bg-pink-500 text-white"
                      : isDisabled
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-100 text-gray-700 hover:bg-pink-50 hover:text-pink-600 active:scale-95"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// タイピングインジケーター
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
          <div
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          />
          <div
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          />
        </div>
      </div>
    </div>
  );
}

// 進捗バー
function ProgressBar({
  current,
  total,
  percentage,
}: {
  current: number;
  total: number;
  percentage: number;
}) {
  return (
    <div className="w-full px-4 py-3 bg-gray-50 border-b border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-500">診断進捗</span>
        <span className="text-xs text-gray-500">
          {current} / {total}
        </span>
      </div>
      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-pink-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// 入力エリア
function InputArea({
  onSubmit,
  onSkip,
  placeholder,
  inputType,
  disabled,
}: {
  onSubmit: (value: AnswerValue) => void;
  onSkip: () => void;
  placeholder?: string;
  inputType: "text" | "number" | "date";
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    if (inputType === "number") {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        onSubmit(numValue);
      }
    } else {
      onSubmit(value);
    }
    setValue("");
  };

  return (
    <div className="p-4 bg-gray-50 border-t border-gray-200">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type={inputType}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder || "入力してください..."}
          disabled={disabled}
          className={cn(
            "flex-1 px-4 py-3 rounded-full bg-white text-gray-900 border border-gray-200",
            "placeholder-gray-400 outline-none focus:ring-2 focus:ring-pink-500",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className={cn(
            "px-6 py-3 rounded-full bg-pink-500 text-white font-medium",
            "hover:bg-pink-600 transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          送信
        </button>
      </form>
      <button
        onClick={onSkip}
        disabled={disabled}
        className="mt-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        スキップ
      </button>
    </div>
  );
}

// 完了画面
function CompletionScreen({ onViewStores }: { onViewStores: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 mb-6 bg-pink-500 rounded-full flex items-center justify-center">
        <svg
          className="w-10 h-10 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">診断完了！</h2>
      <p className="text-gray-500 mb-6">
        あなたにぴったりのお店を見つけましょう
      </p>
      <button
        onClick={onViewStores}
        className={cn(
          "px-8 py-4 rounded-full",
          "bg-pink-500",
          "text-white font-bold text-lg",
          "hover:bg-pink-600 transition-colors",
          "shadow-lg shadow-pink-500/25"
        )}
      >
        店舗を探す
      </button>
    </div>
  );
}

// メインコンテナ
interface DiagnosisChatContainerProps {
  className?: string;
  onComplete?: () => void;
}

export function DiagnosisChatContainer({
  className,
  onComplete,
}: DiagnosisChatContainerProps) {
  const {
    messages,
    isTyping,
    isCompleted,
    isLoading,
    progress,
    currentQuestionIndex,
    startDiagnosis,
    selectOption,
    submitAnswer,
    skipQuestion,
    completeDiagnosis,
  } = useDiagnosis();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // 初期化
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      startDiagnosis().catch(console.error);
    }
  }, [initialized, startDiagnosis]);

  // 新しいメッセージが追加されたらスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // 選択肢をリセット（新しい質問が表示されたら）
  useEffect(() => {
    setSelectedOptionId(null);
  }, [currentQuestionIndex]);

  // 現在の質問を取得
  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const inputType =
    currentQuestion?.type === "number"
      ? "number"
      : currentQuestion?.type === "date"
        ? "date"
        : "text";

  // 選択肢を選択
  const handleSelectOption = async (option: QuestionOption) => {
    setSelectedOptionId(option.id);
    await selectOption(option);
  };

  // テキスト入力を送信
  const handleSubmitText = async (value: AnswerValue) => {
    await submitAnswer(value);
  };

  // 完了時の処理
  const handleComplete = async () => {
    if (!isCompleted) {
      await completeDiagnosis();
    }
    onComplete?.();
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-200",
        className
      )}
    >
      {/* 進捗バー */}
      <ProgressBar
        current={progress.current}
        total={progress.total}
        percentage={progress.percentage}
      />

      {/* チャットエリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          // 最後のAIメッセージのみ選択肢を有効にする
          const isLastAiMessage =
            message.type === "ai" &&
            index === messages.length - 1 &&
            !isTyping;

          return (
            <ChatMessage
              key={message.id}
              type={message.type}
              content={message.content}
              options={isLastAiMessage ? message.options : undefined}
              onSelectOption={
                isLastAiMessage ? handleSelectOption : undefined
              }
              selectedOptionId={isLastAiMessage ? selectedOptionId : null}
            />
          );
        })}

        {isTyping && <TypingIndicator />}

        {isCompleted && <CompletionScreen onViewStores={handleComplete} />}

        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア（完了していない場合のみ表示） */}
      {!isCompleted && currentQuestion && (
        <InputArea
          onSubmit={handleSubmitText}
          onSkip={skipQuestion}
          placeholder={currentQuestion.placeholder}
          inputType={inputType}
          disabled={isTyping || selectedOptionId !== null}
        />
      )}
    </div>
  );
}
