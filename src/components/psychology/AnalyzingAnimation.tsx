"use client";

import { useEffect, useState } from "react";
import { Brain } from "lucide-react";

interface AnalyzingAnimationProps {
  onComplete: () => void;
}

export function AnalyzingAnimation({ onComplete }: AnalyzingAnimationProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);

    const timer = setTimeout(() => {
      clearInterval(dotInterval);
      onComplete();
    }, 2500);

    return () => {
      clearInterval(dotInterval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6">
      <div className="relative">
        <Brain
          className="w-20 h-20 text-(--primary) animate-[pulse_1.2s_ease-in-out_infinite]"
        />
      </div>
      <p className="text-lg font-medium text-(--text-main)">
        分析中{dots}
      </p>
    </div>
  );
}
