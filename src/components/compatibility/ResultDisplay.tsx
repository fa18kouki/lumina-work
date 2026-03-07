"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, Star, RotateCcw, Sparkles, MapPin, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CompatibilityResult } from "@/lib/compatibility/calculate";

interface ResultDisplayProps {
  result: CompatibilityResult;
  name1: string;
  name2: string;
  onRetry: () => void;
}

function useCountUp(target: number, duration: number) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return value;
}

function StarRating({ stars, delay }: { stars: number; delay: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`flex gap-0.5 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < stars ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
          }`}
        />
      ))}
    </div>
  );
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

export function ResultDisplay({
  result,
  name1,
  name2,
  onRetry,
}: ResultDisplayProps) {
  const displayPercentage = useCountUp(result.percentage, 1500);

  return (
    <div className="space-y-5">
      {/* メインスコア */}
      <div className="text-center space-y-3">
        <p className="text-sm text-(--text-sub)">
          {name1} × {name2}
        </p>
        <div className="relative inline-flex items-center justify-center">
          <Heart
            className="w-28 h-28 text-(--primary) opacity-20"
            fill="currentColor"
          />
          <span className="absolute text-4xl font-bold text-(--primary)">
            {displayPercentage}
            <span className="text-xl">%</span>
          </span>
        </div>
        <FadeIn delay={1200}>
          <h2 className="text-xl font-bold text-(--text-main)">
            {result.typeName}
          </h2>
          <p className="text-sm text-(--text-sub) mt-2 leading-relaxed">
            {result.comment}
          </p>
        </FadeIn>
      </div>

      {/* 二人の恋愛タイプ */}
      <FadeIn delay={1600}>
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-(--text-main) flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-(--primary)" />
            二人の恋愛タイプ
          </h3>
          <div className="space-y-2.5">
            <div className="bg-(--primary-bg) rounded-xl p-3">
              <p className="text-sm font-medium text-(--primary)">
                {name1}：{result.loveType1.name}
              </p>
              <p className="text-xs text-(--text-sub) mt-0.5">
                {result.loveType1.description}
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-sm font-medium text-blue-600">
                {name2}：{result.loveType2.name}
              </p>
              <p className="text-xs text-(--text-sub) mt-0.5">
                {result.loveType2.description}
              </p>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* 相性レーダー 5項目 */}
      <FadeIn delay={2000}>
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-(--text-main)">
            相性レーダー
          </h3>
          {result.details.map((detail, i) => (
            <div
              key={detail.label}
              className="flex items-center justify-between"
            >
              <span className="text-sm text-(--text-sub)">{detail.label}</span>
              <StarRating stars={detail.stars} delay={2200 + i * 150} />
            </div>
          ))}
        </div>
      </FadeIn>

      {/* ラッキー情報 */}
      <FadeIn delay={2800}>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-(--text-main) mb-3">
            ラッキー情報
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-(--primary) shrink-0" />
              <div>
                <p className="text-xs text-(--text-sub)">ラッキーカラー</p>
                <p className="text-sm font-medium text-(--text-main)">
                  {result.lucky.color}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-(--primary) shrink-0" />
              <div>
                <p className="text-xs text-(--text-sub)">デートスポット</p>
                <p className="text-sm font-medium text-(--text-main)">
                  {result.lucky.dateSpot}
                </p>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* アドバイス */}
      <FadeIn delay={3200}>
        <div className="bg-gradient-to-r from-(--primary-bg) to-pink-50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-(--text-main) mb-2">
            アドバイス
          </h3>
          <p className="text-sm text-(--text-sub) leading-relaxed">
            {result.advice}
          </p>
        </div>
      </FadeIn>

      {/* リプレイ */}
      <FadeIn delay={3500}>
        <Button onClick={onRetry} variant="outline" className="w-full py-3">
          <RotateCcw className="w-4 h-4 mr-2" />
          もう一度占う
        </Button>
      </FadeIn>
    </div>
  );
}
