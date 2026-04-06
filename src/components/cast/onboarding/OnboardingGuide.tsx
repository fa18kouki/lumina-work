"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useOnboardingSteps } from "./useOnboardingSteps";
import { OnboardingStepItem } from "./OnboardingStepItem";

interface Profile {
  nickname?: string | null;
  age?: number | null;
  description?: string | null;
  photos?: string[] | null;
}

interface OnboardingGuideProps {
  profile: Profile | null | undefined;
}

export function OnboardingGuide({ profile }: OnboardingGuideProps) {
  const { steps, completedCount, totalCount, allCompleted } =
    useOnboardingSteps(profile);

  if (allCompleted) return null;

  const progressPercent = (completedCount / totalCount) * 100;

  // 最初の未完了ステップを探す
  const firstIncompleteIndex = steps.findIndex((s) => !s.completed);

  return (
    <Card>
      <CardContent className="py-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-(--text-main)">
            はじめてガイド
          </h2>
          <span className="text-xs text-(--text-sub)">
            {completedCount}/{totalCount} 完了
          </span>
        </div>

        {/* プログレスバー */}
        <div className="w-full h-1.5 bg-gray-100 rounded-full mb-4">
          <div
            className="h-full bg-(--primary) rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* ステップリスト */}
        <div>
          {steps.map((step, index) => (
            <OnboardingStepItem
              key={step.id}
              step={step}
              isActive={index === firstIncompleteIndex}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
