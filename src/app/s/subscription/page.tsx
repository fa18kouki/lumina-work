"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown, ExternalLink, Tag } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useStoreSession } from "@/lib/auth-helpers";
import { trpc } from "@/lib/trpc";
import {
  SUBSCRIPTION_PLANS,
  type SubscriptionPlanId,
} from "@/lib/constants";

export default function StoreSubscriptionPage() {
  const router = useRouter();
  const { user, status } = useStoreSession();
  const [toast, setToast] = useState<string | null>(null);

  const {
    data: subscription,
    isLoading: subLoading,
  } = trpc.subscription.getSubscription.useQuery(undefined, {
    enabled: status === "authenticated",
  });

  const createCheckout = trpc.subscription.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      setToast(error.message);
      setTimeout(() => setToast(null), 4000);
    },
  });

  const createPortal = trpc.subscription.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      setToast(error.message);
      setTimeout(() => setToast(null), 4000);
    },
  });

  if (status === "unauthenticated") {
    router.push("/s/login");
    return null;
  }

  if (status === "loading" || !user || subLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  const currentPlan = (subscription?.plan ?? "CASUAL") as SubscriptionPlanId;
  const hasStripeSubscription = subscription && "stripeCustomerId" in subscription && subscription.stripeCustomerId;

  // トライアル残り日数
  const trialEndsAt = subscription && "trialEndsAt" in subscription ? subscription.trialEndsAt : null;
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const isInTrial = trialDaysLeft > 0;

  const handlePlanAction = (planId: SubscriptionPlanId) => {
    if (planId === currentPlan) return;
    createCheckout.mutate({ plan: planId });
  };

  const handleManageSubscription = () => {
    createPortal.mutate();
  };

  const isPending = createCheckout.isPending || createPortal.isPending;

  const currentPlanDef = SUBSCRIPTION_PLANS.find((p) => p.id === currentPlan);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-(--text-main)">
        プラン・お支払い
      </h1>

      {/* トライアル状態 */}
      {isInTrial && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-800">
            無料トライアル期間中（残り{trialDaysLeft}日）
          </p>
          <p className="text-xs text-blue-600 mt-1">
            トライアル期間中はオファー送信が無制限でご利用いただけます
          </p>
        </div>
      )}

      {/* 現在のプラン */}
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-(--text-sub) mb-1">現在のプラン</p>
          <p className="text-lg font-bold text-(--text-main)">
            {currentPlanDef?.name ?? "カジュアル"}プラン
          </p>
        </div>
        {hasStripeSubscription && (
          <button
            onClick={handleManageSubscription}
            disabled={isPending}
            className="inline-flex items-center gap-1 text-sm text-slate-700 font-semibold hover:underline disabled:opacity-50"
          >
            <ExternalLink className="w-4 h-4" />
            支払い管理
          </button>
        )}
      </div>

      {/* 共通仕様の説明 */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-(--text-sub) space-y-1">
        <p>・全プラン共通: アカウント登録から<strong>3ヶ月間は無料</strong>（オファー無制限）</p>
        <p>・料金は全て<strong>税別・1店舗あたりの月額</strong>です</p>
      </div>

      {/* カジュアルプラン */}
      <div>
        <h2 className="text-lg font-bold text-(--text-main) mb-3">カジュアル版</h2>
        {(() => {
          const plan = SUBSCRIPTION_PLANS[0];
          const isCurrent = plan.id === currentPlan;
          return (
            <div
              className={`bg-white rounded-lg border-2 shadow-sm p-5 max-w-md ${
                isCurrent ? "border-(--secondary-blue-text)" : "border-gray-100"
              }`}
            >
              <div className="mb-3">
                <h3 className="text-lg font-bold text-(--text-main)">{plan.name}</h3>
                <p className="text-xs text-(--text-sub) mt-1">{plan.description}</p>
              </div>

              <div className="mb-4">
                <span className="text-2xl font-bold text-(--text-main)">{plan.priceLabel}</span>
                <span className="text-sm text-(--text-sub)">/月・1店舗</span>
              </div>

              <ul className="space-y-2 mb-5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-(--text-main)">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanAction(plan.id)}
                disabled={isCurrent || isPending}
                className={`w-full py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isCurrent
                    ? "bg-gray-100 text-(--text-sub) cursor-default"
                    : "bg-white border border-gray-200 text-(--text-main) hover:bg-gray-50 disabled:opacity-50"
                }`}
              >
                {isPending ? "処理中..." : isCurrent ? "現在のプラン" : "このプランを選択"}
              </button>
            </div>
          );
        })()}
      </div>

      {/* プロ版 */}
      <div>
        <h2 className="text-lg font-bold text-(--text-main) mb-3">プロ版（オファー無制限）</h2>
        <p className="text-sm text-(--text-sub) mb-4">
          機能は全プラン共通。登録する店舗数に応じて単価が変わります。
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {SUBSCRIPTION_PLANS.filter((p) => p.tier === "pro").map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const isRecommended = "recommended" in plan && plan.recommended;

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-lg border-2 shadow-sm p-5 flex flex-col ${
                  isRecommended
                    ? "border-slate-700"
                    : isCurrent
                      ? "border-(--secondary-blue-text)"
                      : "border-gray-100"
                }`}
              >
                {isRecommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-slate-700 text-white text-xs font-bold px-3 py-1 rounded-md">
                      <Crown className="w-3 h-3" />
                      おすすめ
                    </span>
                  </div>
                )}

                {"discount" in plan && plan.discount && (
                  <div className="absolute -top-3 right-3">
                    <span className="inline-flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                      <Tag className="w-3 h-3" />
                      {plan.discount}
                    </span>
                  </div>
                )}

                <div className="mb-3">
                  <h3 className="text-lg font-bold text-(--text-main)">{plan.name}</h3>
                  {"storeRange" in plan && (
                    <p className="text-xs text-(--text-sub) mt-0.5">対象: {plan.storeRange}</p>
                  )}
                  <p className="text-xs text-(--text-sub) mt-1">{plan.description}</p>
                </div>

                <div className="mb-4">
                  <span className="text-2xl font-bold text-(--text-main)">{plan.priceLabel}</span>
                  <span className="text-sm text-(--text-sub)">/月・1店舗</span>
                </div>

                <ul className="space-y-2 mb-5 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-(--text-main)">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanAction(plan.id)}
                  disabled={isCurrent || isPending}
                  className={`w-full py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isCurrent
                      ? "bg-gray-100 text-(--text-sub) cursor-default"
                      : isRecommended
                        ? "bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-50"
                        : "bg-white border border-gray-200 text-(--text-main) hover:bg-gray-50 disabled:opacity-50"
                  }`}
                >
                  {isPending ? "処理中..." : isCurrent ? "現在のプラン" : "このプランを選択"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* トースト */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-gray-900 text-white text-sm px-5 py-3 rounded-md shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
