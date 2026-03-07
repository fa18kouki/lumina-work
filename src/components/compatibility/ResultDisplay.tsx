"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, Star, RotateCcw } from "lucide-react";
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
      // ease-out
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
          className={`w-5 h-5 ${
            i < stars ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
          }`}
        />
      ))}
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
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowDetails(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
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
        <div
          className={`transition-all duration-500 ${
            showDetails
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          <h2 className="text-xl font-bold text-(--text-main)">
            {result.typeName}
          </h2>
          <p className="text-sm text-(--text-sub) mt-2 leading-relaxed">
            {result.comment}
          </p>
        </div>
      </div>

      {/* 詳細項目 */}
      <div
        className={`bg-white rounded-2xl p-5 shadow-sm space-y-4 transition-all duration-500 ${
          showDetails
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
        }`}
      >
        <h3 className="text-sm font-semibold text-(--text-main)">詳細</h3>
        {result.details.map((detail, i) => (
          <div key={detail.label} className="flex items-center justify-between">
            <span className="text-sm text-(--text-sub)">{detail.label}</span>
            <StarRating stars={detail.stars} delay={1400 + i * 200} />
          </div>
        ))}
      </div>

      {/* リプレイ */}
      <Button
        onClick={onRetry}
        variant="outline"
        className="w-full py-3"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        もう一度占う
      </Button>
    </div>
  );
}
