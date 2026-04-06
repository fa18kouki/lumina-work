"use client";

import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import type { OnboardingStep } from "./useOnboardingSteps";

interface OnboardingStepItemProps {
  step: OnboardingStep;
  isActive: boolean;
  isLast: boolean;
}

export function OnboardingStepItem({
  step,
  isActive,
  isLast,
}: OnboardingStepItemProps) {
  const Icon = step.icon;

  const content = (
    <div
      className={`flex items-center gap-3 py-3 ${!isLast ? "border-b border-gray-100" : ""} ${isActive ? "cursor-pointer" : ""}`}
    >
      {/* ステップインジケーター */}
      {step.completed ? (
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <Check className="w-4 h-4 text-emerald-600" />
        </div>
      ) : (
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            isActive ? "bg-(--primary) text-white" : "bg-gray-100 text-gray-400"
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
      )}

      {/* テキスト */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            step.completed
              ? "text-(--text-sub)"
              : isActive
                ? "text-(--text-main)"
                : "text-(--text-sub)"
          }`}
        >
          {step.label}
        </p>
        {isActive && !step.completed && (
          <p className="text-xs text-(--text-sub) mt-0.5">
            {step.description}
          </p>
        )}
      </div>

      {/* 矢印 */}
      {isActive && !step.completed && (
        <ChevronRight className="w-4 h-4 text-(--text-sub) shrink-0" />
      )}
    </div>
  );

  if (isActive && !step.completed) {
    return <Link href={step.href}>{content}</Link>;
  }

  return content;
}
