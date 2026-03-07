"use client";

import { useEffect, useState } from "react";
import { Brain, Star, RotateCcw, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PsychologyResult as PsychologyResultType } from "@/lib/psychology/calculate";

interface PsychologyResultProps {
  result: PsychologyResultType;
  onRetry: () => void;
}

function FadeIn({
  delay,
  children,
}: {
  delay: number;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {children}
    </div>
  );
}

function ScoreBar({
  label,
  value,
  delay,
}: {
  label: string;
  value: number;
  delay: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`space-y-1 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="flex justify-between text-sm">
        <span className="text-(--text-sub)">{label}</span>
        <span className="font-medium text-(--text-main)">{value}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div
          className="bg-(--primary) h-2.5 rounded-full transition-all duration-700 ease-out"
          style={{ width: visible ? `${value}%` : "0%" }}
        />
      </div>
    </div>
  );
}

export function PsychologyResult({
  result,
  onRetry,
}: PsychologyResultProps) {
  return (
    <div className="space-y-5">
      {/* メインタイプ */}
      <div className="text-center space-y-3">
        <div className="w-20 h-20 mx-auto rounded-full bg-(--primary-bg) flex items-center justify-center">
          <Brain className="w-10 h-10 text-(--primary)" />
        </div>
        <FadeIn delay={300}>
          <p className="text-xs text-(--text-sub)">あなたの接客スタイルは...</p>
          <h2 className="text-2xl font-bold text-(--primary) mt-1">
            {result.typeName}
          </h2>
        </FadeIn>
        <FadeIn delay={600}>
          <p className="text-sm text-(--text-sub) leading-relaxed">
            {result.description}
          </p>
        </FadeIn>
      </div>

      {/* スコアレーダー */}
      <FadeIn delay={1000}>
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-(--text-main) flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-(--primary)" />
            あなたのスキルバランス
          </h3>
          <ScoreBar label="魅力 (Charm)" value={result.scores.charm} delay={1200} />
          <ScoreBar label="知性 (Intellect)" value={result.scores.intellect} delay={1350} />
          <ScoreBar label="包容力 (Warmth)" value={result.scores.warmth} delay={1500} />
          <ScoreBar label="活力 (Energy)" value={result.scores.energy} delay={1650} />
        </div>
      </FadeIn>

      {/* 強み */}
      <FadeIn delay={1800}>
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-(--text-main) flex items-center gap-1.5">
            <Star className="w-4 h-4 text-(--primary)" />
            あなたの強み
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.strengths.map((strength) => (
              <span
                key={strength}
                className="px-3 py-1.5 rounded-full bg-(--primary-bg) text-(--primary) text-sm font-medium"
              >
                {strength}
              </span>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* アドバイス */}
      <FadeIn delay={2200}>
        <div className="bg-gradient-to-r from-(--primary-bg) to-pink-50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-(--text-main) mb-2 flex items-center gap-1.5">
            <ArrowRight className="w-4 h-4 text-(--primary)" />
            ステップアップのヒント
          </h3>
          <p className="text-sm text-(--text-sub) leading-relaxed">
            {result.advice}
          </p>
        </div>
      </FadeIn>

      {/* リトライ */}
      <FadeIn delay={2500}>
        <Button onClick={onRetry} variant="outline" className="w-full py-3">
          <RotateCcw className="w-4 h-4 mr-2" />
          もう一度診断する
        </Button>
      </FadeIn>
    </div>
  );
}
