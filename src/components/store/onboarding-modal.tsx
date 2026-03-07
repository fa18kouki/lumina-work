"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AreaSelect } from "@/components/ui/area-select";
import { trpc } from "@/lib/trpc";

const REFERRAL_OPTIONS = [
  "SNS（Twitter/X）",
  "SNS（Instagram）",
  "SNS（TikTok）",
  "Google検索",
  "知人の紹介",
  "求人サイト",
  "営業担当から",
  "その他",
] as const;

interface OnboardingModalProps {
  onComplete: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [referralSource, setReferralSource] = useState("");

  const utils = trpc.useUtils();
  const upsertProfile = trpc.store.upsertProfile.useMutation();

  const isStep1Valid = name.trim() !== "" && area !== "" && address.trim() !== "";
  const isStep2Valid = referralSource !== "";

  const handleComplete = async () => {
    await upsertProfile.mutateAsync({
      name: name.trim(),
      area,
      address: address.trim(),
      referralSource,
    });
    await utils.store.getProfile.invalidate();
    onComplete();
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50"
      data-testid="onboarding-overlay"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-8">
        {/* ステップインジケーター */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === 1
                ? "bg-(--primary) text-white"
                : "bg-gray-200 text-(--text-sub)"
            }`}
          >
            1
          </div>
          <div className="w-8 h-px bg-gray-300" />
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step === 2
                ? "bg-(--primary) text-white"
                : "bg-gray-200 text-(--text-sub)"
            }`}
          >
            2
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-(--text-main) text-center">
              基本情報を入力してください
            </h2>
            <Input
              id="store-name"
              label="店舗名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: Club XXXX"
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                エリア
              </label>
              <AreaSelect
                value={area}
                onChange={setArea}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            <Input
              id="store-address"
              label="住所"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="例: 東京都港区六本木1-1-1"
            />
            <Button
              size="lg"
              className="w-full"
              disabled={!isStep1Valid}
              onClick={() => setStep(2)}
            >
              次へ
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-(--text-main) text-center">
              どこでこのサービスを知りましたか？
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {REFERRAL_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setReferralSource(option)}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    referralSource === option
                      ? "border-pink-500 bg-pink-50 text-pink-700"
                      : "border-gray-300 bg-white text-(--text-main) hover:bg-gray-50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => setStep(1)}
              >
                戻る
              </Button>
              <Button
                size="lg"
                className="flex-1"
                disabled={!isStep2Valid || upsertProfile.isPending}
                isLoading={upsertProfile.isPending}
                onClick={handleComplete}
              >
                完了
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
