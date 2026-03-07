"use client";

import { useCallback, useState } from "react";
import { NameInputForm } from "./NameInputForm";
import { DivinationAnimation } from "./DivinationAnimation";
import { ResultDisplay } from "./ResultDisplay";
import {
  calculateCompatibility,
  type CompatibilityInput,
  type CompatibilityResult,
} from "@/lib/compatibility/calculate";

type GamePhase = "input" | "divining" | "result";

export function CompatibilityGame() {
  const [phase, setPhase] = useState<GamePhase>("input");
  const [input, setInput] = useState<CompatibilityInput | null>(null);
  const [result, setResult] = useState<CompatibilityResult | null>(null);

  const handleSubmit = (data: CompatibilityInput) => {
    setInput(data);
    setPhase("divining");
  };

  const handleDivinationComplete = useCallback(() => {
    if (!input) return;
    const calcResult = calculateCompatibility(input);
    setResult(calcResult);
    setPhase("result");
  }, [input]);

  const handleRetry = () => {
    setPhase("input");
    setResult(null);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {phase === "input" && <NameInputForm onSubmit={handleSubmit} />}
      {phase === "divining" && (
        <DivinationAnimation onComplete={handleDivinationComplete} />
      )}
      {phase === "result" && result && input && (
        <ResultDisplay
          result={result}
          name1={input.name1}
          name2={input.name2}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}
