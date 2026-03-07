"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

interface DivinationAnimationProps {
  onComplete: () => void;
}

export function DivinationAnimation({ onComplete }: DivinationAnimationProps) {
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
        <Heart
          className="w-20 h-20 text-(--primary) animate-[heartbeat_0.8s_ease-in-out_infinite]"
          fill="currentColor"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Heart
            className="w-20 h-20 text-(--primary) opacity-30 animate-[heartbeat_0.8s_ease-in-out_infinite_0.4s]"
            fill="currentColor"
          />
        </div>
      </div>
      <p className="text-lg font-medium text-(--text-main)">
        占い中{dots}
      </p>
    </div>
  );
}
