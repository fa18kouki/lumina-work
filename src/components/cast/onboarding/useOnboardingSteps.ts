"use client";

import { useState, useEffect } from "react";
import {
  UserCircle,
  Camera,
  Store,
  Bell,
  type LucideIcon,
} from "lucide-react";

export interface OnboardingStep {
  id: number;
  label: string;
  description: string;
  href: string;
  completed: boolean;
  icon: LucideIcon;
}

interface UseOnboardingStepsReturn {
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
  allCompleted: boolean;
}

const STORAGE_KEYS = {
  storesViewed: "lumina:onboarding:storesViewed",
  offersViewed: "lumina:onboarding:offersViewed",
} as const;

interface Profile {
  nickname?: string | null;
  age?: number | null;
  description?: string | null;
  photos?: string[] | null;
}

export function useOnboardingSteps(
  profile: Profile | null | undefined
): UseOnboardingStepsReturn {
  const [localFlags, setLocalFlags] = useState({
    storesViewed: false,
    offersViewed: false,
  });

  useEffect(() => {
    setLocalFlags({
      storesViewed:
        localStorage.getItem(STORAGE_KEYS.storesViewed) === "true",
      offersViewed:
        localStorage.getItem(STORAGE_KEYS.offersViewed) === "true",
    });
  }, []);

  const steps: OnboardingStep[] = [
    {
      id: 1,
      label: "プロフィールを入力しよう",
      description: "基本情報と自己PRを登録しましょう",
      href: "/c/profile/edit",
      completed: Boolean(
        profile?.nickname && profile?.age && profile?.description
      ),
      icon: UserCircle,
    },
    {
      id: 2,
      label: "写真を登録しよう",
      description: "写真があるとオファーが届きやすくなります",
      href: "/c/profile/edit",
      completed: Boolean(profile?.photos && profile.photos.length >= 1),
      icon: Camera,
    },
    {
      id: 3,
      label: "店舗をチェックしよう",
      description: "気になる店舗を探してみましょう",
      href: "/c/stores",
      completed: localFlags.storesViewed,
      icon: Store,
    },
    {
      id: 4,
      label: "オファーを確認しよう",
      description: "届いたオファーをチェックしましょう",
      href: "/c/offers",
      completed: localFlags.offersViewed,
      icon: Bell,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;

  return {
    steps,
    completedCount,
    totalCount: steps.length,
    allCompleted: completedCount === steps.length,
  };
}
