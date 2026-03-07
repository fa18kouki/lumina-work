"use client";

import { useState } from "react";
import type { Question } from "@/lib/psychology/question-data";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (choiceIndex: number) => void;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
}: QuestionCardProps) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
    setTimeout(() => onAnswer(index), 400);
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <p className="text-xs text-(--text-sub)">
          Q{questionNumber} / {totalQuestions}
        </p>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-(--primary) h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      <h2 className="text-base font-bold text-(--text-main) text-center leading-relaxed">
        {question.text}
      </h2>

      <div className="space-y-2.5">
        {question.choices.map((choice, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSelect(i)}
            className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm transition-all duration-300 ${
              selected === i
                ? "bg-(--primary) text-white border-(--primary) scale-[0.98]"
                : selected !== null
                  ? "bg-gray-50 text-gray-300 border-gray-100"
                  : "bg-white text-(--text-main) border-gray-200 hover:border-(--primary) hover:bg-(--primary-bg) active:scale-[0.98]"
            }`}
          >
            {choice.text}
          </button>
        ))}
      </div>
    </div>
  );
}
