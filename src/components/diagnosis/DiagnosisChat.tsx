"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  type: "ai" | "user";
  content: string;
  options?: ChatOption[];
  timestamp: Date;
}

export interface ChatOption {
  id: string;
  label: string;
  value: string;
}

interface DiagnosisChatProps {
  messages: ChatMessage[];
  onSelectOption: (option: ChatOption) => void;
  isTyping?: boolean;
  className?: string;
  /** 最後のAIメッセージの下にカスタム入力を表示（エリア選択など） */
  renderCustomInput?: () => React.ReactNode;
}

export function DiagnosisChat({
  messages,
  onSelectOption,
  isTyping = false,
  className,
  renderCustomInput,
}: DiagnosisChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // 新しいメッセージが追加されたらスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // 新しいメッセージが追加されたら選択状態をリセット
  useEffect(() => {
    setSelectedOptionId(null);
  }, [messages.length]);

  const handleOptionClick = (option: ChatOption, messageId: string) => {
    setSelectedOptionId(`${messageId}-${option.id}`);
    onSelectOption(option);
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-200",
        className
      )}
    >
      {/* チャットエリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isLastAiMessage =
            message.type === "ai" && index === messages.length - 1;

          return (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.type === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3",
                  message.type === "user"
                    ? "bg-pink-500 text-white"
                    : "bg-white text-gray-900 border border-gray-200 shadow-sm"
                )}
              >
                {/* メッセージ本文 */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>

                {/* 選択肢（最後のAIメッセージのみ操作可能） */}
                {message.options && message.options.length > 0 && !renderCustomInput && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.options.map((option) => {
                      const optionKey = `${message.id}-${option.id}`;
                      const isSelected = selectedOptionId === optionKey;
                      const isDisabled =
                        !isLastAiMessage || selectedOptionId !== null;

                      return (
                        <button
                          key={option.id}
                          onClick={() =>
                            handleOptionClick(option, message.id)
                          }
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
        })}

        {/* カスタム入力（エリア選択など） */}
        {renderCustomInput && !isTyping && messages.length > 0 && (
          <div className="px-1">
            {renderCustomInput()}
          </div>
        )}

        {/* タイピングインジケーター */}
        {isTyping && (
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
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

// 進捗インジケーター
interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function StepIndicator({
  currentStep,
  totalSteps,
  className,
}: StepIndicatorProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-500">診断進捗</span>
        <span className="text-xs text-gray-500">
          {currentStep} / {totalSteps}
        </span>
      </div>
      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-pink-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
