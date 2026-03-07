"use client";

import { useEffect, useState } from "react";
import { Sparkles, RotateCcw, Zap, Eye, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DiagnosisResult as DiagnosisResultType } from "@/lib/type-diagnosis/calculate";

interface DiagnosisResultProps {
  result: DiagnosisResultType;
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

function CoordinateMap({
  x,
  y,
  delay,
}: {
  x: number;
  y: number;
  delay: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // -100~100 → 0~100% (左がcool, 右がcute, 上がactive, 下がmysterious)
  const dotX = 50 + (x / 100) * 40;
  const dotY = 50 - (y / 100) * 40;

  return (
    <div
      className={`transition-all duration-700 ${
        visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      }`}
    >
      <div className="relative w-full aspect-square max-w-[240px] mx-auto">
        {/* 背景グリッド */}
        <div className="absolute inset-0 border border-gray-200 rounded-xl bg-gray-50">
          {/* 十字線 */}
          <div className="absolute top-1/2 left-[10%] right-[10%] h-px bg-gray-200" />
          <div className="absolute left-1/2 top-[10%] bottom-[10%] w-px bg-gray-200" />
        </div>

        {/* ラベル */}
        <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] text-(--text-sub)">
          アクティブ
        </span>
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-(--text-sub)">
          ミステリアス
        </span>
        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] text-(--text-sub)">
          クール
        </span>
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-(--text-sub)">
          キュート
        </span>

        {/* ポジションドット */}
        <div
          className="absolute w-4 h-4 rounded-full bg-purple-500 shadow-lg shadow-purple-200 transition-all duration-1000 ease-out"
          style={{
            left: `${visible ? dotX : 50}%`,
            top: `${visible ? dotY : 50}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>
    </div>
  );
}

export function DiagnosisResult({
  result,
  onRetry,
}: DiagnosisResultProps) {
  return (
    <div className="space-y-5">
      {/* メインタイプ */}
      <div className="text-center space-y-3">
        <div className="w-20 h-20 mx-auto rounded-full bg-purple-50 flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-purple-500" />
        </div>
        <FadeIn delay={300}>
          <p className="text-xs text-(--text-sub)">
            お客様から見たあなたは...
          </p>
          <h2 className="text-2xl font-bold text-purple-600 mt-1">
            {result.typeName}
          </h2>
        </FadeIn>
        <FadeIn delay={600}>
          <p className="text-sm text-(--text-sub) leading-relaxed">
            {result.description}
          </p>
        </FadeIn>
      </div>

      {/* 2Dマップ */}
      <FadeIn delay={1000}>
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-(--text-main)">
            あなたのポジション
          </h3>
          <CoordinateMap
            x={result.coordinates.x}
            y={result.coordinates.y}
            delay={1200}
          />
        </div>
      </FadeIn>

      {/* 印象・必殺技 */}
      <FadeIn delay={1800}>
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-(--text-main) flex items-center gap-1.5 mb-2">
              <Eye className="w-4 h-4 text-purple-500" />
              お客様からの印象
            </h3>
            <p className="text-sm text-(--text-sub) leading-relaxed">
              {result.impression}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-(--text-main) flex items-center gap-1.5 mb-2">
              <Zap className="w-4 h-4 text-purple-500" />
              あなたの必殺技
            </h3>
            <p className="text-sm font-medium text-purple-600 bg-purple-50 rounded-xl px-4 py-3">
              {result.specialMove}
            </p>
          </div>
        </div>
      </FadeIn>

      {/* サブタイプ */}
      <FadeIn delay={2200}>
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-(--text-main) mb-2 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-500" />
            隠れた一面
          </h3>
          <p className="text-sm text-(--text-sub) leading-relaxed">
            あなたには<span className="font-medium text-purple-600">{result.secondaryType}</span>の要素も。
            状況に応じて違う一面を見せることで、お客様をさらに魅了できますよ。
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
