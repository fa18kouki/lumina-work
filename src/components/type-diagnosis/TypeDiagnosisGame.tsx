"use client";

import { useCallback, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DiagnosisQuestion } from "./DiagnosisQuestion";
import { DiagnosisAnimation } from "./DiagnosisAnimation";
import { DiagnosisResult } from "./DiagnosisResult";
import {
  calculateTypeDiagnosis,
  type DiagnosisAnswer,
  type DiagnosisResult as DiagnosisResultType,
} from "@/lib/type-diagnosis/calculate";
import { DIAGNOSIS_QUESTIONS } from "@/lib/type-diagnosis/diagnosis-data";

type GamePhase = "intro" | "questions" | "analyzing" | "result";

export function TypeDiagnosisGame() {
  const [phase, setPhase] = useState<GamePhase>("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<DiagnosisAnswer[]>([]);
  const [result, setResult] = useState<DiagnosisResultType | null>(null);

  const handleStart = () => {
    setPhase("questions");
    setCurrentQuestion(0);
    setAnswers([]);
  };

  const handleAnswer = (choiceIndex: number) => {
    const newAnswers = [
      ...answers,
      { questionIndex: currentQuestion, choiceIndex },
    ];
    setAnswers(newAnswers);

    if (currentQuestion < DIAGNOSIS_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion((prev) => prev + 1), 500);
    } else {
      setPhase("analyzing");
    }
  };

  const handleAnalysisComplete = useCallback(() => {
    const calcResult = calculateTypeDiagnosis(answers);
    setResult(calcResult);
    setPhase("result");
  }, [answers]);

  const handleRetry = () => {
    setPhase("intro");
    setResult(null);
    setAnswers([]);
    setCurrentQuestion(0);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {phase === "intro" && (
        <div className="text-center space-y-5">
          <div className="w-20 h-20 mx-auto rounded-full bg-purple-50 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-purple-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-(--text-main)">
              接客キャラ診断
            </h1>
            <p className="text-sm text-(--text-sub) leading-relaxed">
              8つの質問に答えて、お客様から見たあなたの「接客キャラ」を発見しましょう。
              <br />
              自分では気づかない魅力がわかるかも？
            </p>
          </div>
          <Button
            onClick={handleStart}
            className="w-full py-3 text-base bg-purple-500 hover:bg-purple-600"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            診断スタート
          </Button>
        </div>
      )}

      {phase === "questions" && (
        <DiagnosisQuestion
          key={currentQuestion}
          question={DIAGNOSIS_QUESTIONS[currentQuestion]}
          questionNumber={currentQuestion + 1}
          totalQuestions={DIAGNOSIS_QUESTIONS.length}
          onAnswer={handleAnswer}
        />
      )}

      {phase === "analyzing" && (
        <DiagnosisAnimation onComplete={handleAnalysisComplete} />
      )}

      {phase === "result" && result && (
        <DiagnosisResult result={result} onRetry={handleRetry} />
      )}
    </div>
  );
}
