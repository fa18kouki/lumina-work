"use client";

import { useCallback, useState } from "react";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "./QuestionCard";
import { AnalyzingAnimation } from "./AnalyzingAnimation";
import { PsychologyResult } from "./PsychologyResult";
import {
  calculatePsychology,
  type PsychologyAnswer,
  type PsychologyResult as PsychologyResultType,
} from "@/lib/psychology/calculate";
import { QUESTIONS } from "@/lib/psychology/question-data";

type GamePhase = "intro" | "questions" | "analyzing" | "result";

export function PsychologyGame() {
  const [phase, setPhase] = useState<GamePhase>("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<PsychologyAnswer[]>([]);
  const [result, setResult] = useState<PsychologyResultType | null>(null);

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

    if (currentQuestion < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion((prev) => prev + 1), 500);
    } else {
      setPhase("analyzing");
    }
  };

  const handleAnalysisComplete = useCallback(() => {
    const calcResult = calculatePsychology(answers);
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
          <div className="w-20 h-20 mx-auto rounded-full bg-(--primary-bg) flex items-center justify-center">
            <Brain className="w-10 h-10 text-(--primary)" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-(--text-main)">
              接客スタイル診断
            </h1>
            <p className="text-sm text-(--text-sub) leading-relaxed">
              6つの質問に答えて、あなたの接客スタイルを発見しましょう。
              <br />
              キャストとしての隠れた強みがわかるかも？
            </p>
          </div>
          <Button onClick={handleStart} className="w-full py-3 text-base">
            <Brain className="w-5 h-5 mr-2" />
            診断スタート
          </Button>
        </div>
      )}

      {phase === "questions" && (
        <QuestionCard
          key={currentQuestion}
          question={QUESTIONS[currentQuestion]}
          questionNumber={currentQuestion + 1}
          totalQuestions={QUESTIONS.length}
          onAnswer={handleAnswer}
        />
      )}

      {phase === "analyzing" && (
        <AnalyzingAnimation onComplete={handleAnalysisComplete} />
      )}

      {phase === "result" && result && (
        <PsychologyResult result={result} onRetry={handleRetry} />
      )}
    </div>
  );
}
