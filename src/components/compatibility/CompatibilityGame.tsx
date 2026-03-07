"use client";

import { useCallback, useState } from "react";
import { NameInputForm } from "./NameInputForm";
import { DivinationAnimation } from "./DivinationAnimation";
import { ResultDisplay } from "./ResultDisplay";
import {
  calculateCompatibility,
  type CompatibilityResult,
} from "@/lib/compatibility/calculate";

type GamePhase = "input" | "divining" | "result";

export function CompatibilityGame() {
  const [phase, setPhase] = useState<GamePhase>("input");
  const [names, setNames] = useState<{ name1: string; name2: string }>({
    name1: "",
    name2: "",
  });
  const [result, setResult] = useState<CompatibilityResult | null>(null);

  const handleSubmit = (name1: string, name2: string) => {
    setNames({ name1, name2 });
    setPhase("divining");
  };

  const handleDivinationComplete = useCallback(() => {
    const calcResult = calculateCompatibility(names.name1, names.name2);
    setResult(calcResult);
    setPhase("result");
  }, [names]);

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
      {phase === "result" && result && (
        <ResultDisplay
          result={result}
          name1={names.name1}
          name2={names.name2}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}
