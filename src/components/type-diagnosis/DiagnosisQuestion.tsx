"use client";

import { useState } from "react";
import type { DiagnosisQuestion as DiagnosisQuestionType } from "@/lib/type-diagnosis/diagnosis-data";

interface DiagnosisQuestionProps {
  question: DiagnosisQuestionType;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (choiceIndex: number) => void;
}

export function DiagnosisQuestion({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
}: DiagnosisQuestionProps) {
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
            className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      <h2 className="text-base font-bold text-(--text-main) text-center leading-relaxed">
        {question.text}
      </h2>

      <div className={`grid gap-2.5 ${question.choices.length === 2 ? "grid-cols-1" : "grid-cols-1"}`}>
        {question.choices.map((choice, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSelect(i)}
            className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm transition-all duration-300 ${
              selected === i
                ? "bg-purple-500 text-white border-purple-500 scale-[0.98]"
                : selected !== null
                  ? "bg-gray-50 text-gray-300 border-gray-100"
                  : "bg-white text-(--text-main) border-gray-200 hover:border-purple-400 hover:bg-purple-50 active:scale-[0.98]"
            }`}
          >
            {choice.text}
          </button>
        ))}
      </div>
    </div>
  );
}
