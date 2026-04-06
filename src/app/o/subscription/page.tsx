"use client";

import { trpc } from "@/lib/trpc";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";

export default function OwnerSubscriptionPage() {
  const { data: subscription, isLoading } =
    trpc.subscription.getSubscription.useQuery();
  const { data: storeCount } = trpc.owner.getStoreCount.useQuery();

  const createCheckout = trpc.subscription.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });

  const createPortal = trpc.subscription.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[var(--text-sub)]">読み込み中...</div>
      </div>
    );
  }

  const currentPlan = subscription?.plan ?? "CASUAL";

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-[var(--text-main)] mb-2">
        契約・プラン
      </h1>
      <p className="text-sm text-[var(--text-sub)] mb-8">
        現在 {storeCount?.current ?? 0} 店舗を管理中
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={`bg-white rounded-xl p-6 border-2 transition-colors ${
                isCurrent
                  ? "border-slate-900"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-[var(--text-main)]">
                  {plan.name}
                </h3>
                {isCurrent && (
                  <span className="text-xs bg-slate-900 text-white px-2 py-0.5 rounded-md font-medium">
                    現在のプラン
                  </span>
                )}
                {"recommended" in plan && plan.recommended && !isCurrent && (
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">
                    おすすめ
                  </span>
                )}
              </div>

              <p className="text-2xl font-bold text-[var(--text-main)] mb-1">
                {plan.priceLabel}
                <span className="text-sm font-normal text-[var(--text-sub)]">
                  /店舗/月
                </span>
              </p>

              {"storeRange" in plan && plan.storeRange && (
                <p className="text-sm text-[var(--text-sub)] mb-1">
                  {plan.storeRange}
                </p>
              )}
              {"discount" in plan && plan.discount && (
                <p className="text-sm text-green-600 font-medium mb-3">
                  {plan.discount}
                </p>
              )}

              <p className="text-sm text-[var(--text-sub)] mb-4">
                {plan.description}
              </p>

              <ul className="space-y-1.5 mb-5">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="text-sm text-[var(--text-main)] flex items-start gap-2"
                  >
                    <span className="text-green-500 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {!isCurrent && plan.id !== "FREE" && (
                <button
                  onClick={() => createCheckout.mutate({ plan: plan.id as Exclude<typeof plan.id, "FREE"> })}
                  disabled={createCheckout.isPending}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {createCheckout.isPending ? "処理中..." : "このプランに変更"}
                </button>
              )}

              {isCurrent && subscription && "stripeCustomerId" in subscription && subscription.stripeCustomerId && (
                <button
                  onClick={() => createPortal.mutate()}
                  disabled={createPortal.isPending}
                  className="w-full py-2.5 border border-gray-200 text-[var(--text-main)] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  契約を管理
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
