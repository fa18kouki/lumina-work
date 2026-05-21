"use client";

import { Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  VISIBLE_SUBSCRIPTION_PLANS,
  SUBSCRIPTION_CONTACT_EMAIL,
} from "@/lib/constants";

const CONTACT_MAIL_SUBJECT = "プロプランに関するお問い合わせ";
const CONTACT_MAIL_BODY =
  "プロプランに興味があります。下記情報をお知らせいただけますと幸いです。\n\n- 運営店舗数:\n- 想定利用人数:\n- ご希望の契約形態:\n- ご質問・ご要望:";

function buildContactMailto(): string {
  const params = new URLSearchParams({
    subject: CONTACT_MAIL_SUBJECT,
    body: CONTACT_MAIL_BODY,
  });
  return `mailto:${SUBSCRIPTION_CONTACT_EMAIL}?${params.toString()}`;
}

export default function OwnerSubscriptionPage() {
  const { data: subscription, isLoading } =
    trpc.subscription.getSubscription.useQuery();
  const { data: storeCount } = trpc.owner.getStoreCount.useQuery();

  const createPortal = trpc.subscription.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (err) => {
      alert(`契約管理ページの取得に失敗しました: ${err.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[var(--text-sub)]">読み込み中...</div>
      </div>
    );
  }

  const currentPlan = subscription?.plan ?? "FREE";

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-[var(--text-main)] mb-2">
        契約・プラン
      </h1>
      <p className="text-sm text-[var(--text-sub)] mb-6">
        現在 {storeCount?.current ?? 0} 店舗を管理中
      </p>

      {/*
        業態上の本人確認 / 契約形態の個別調整が必要なため、
        有料プランへの変更は自動課金ではなくお問い合わせ経由で受け付ける。
      */}
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Mail className="w-5 h-5 text-slate-700 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-[var(--text-main)] leading-relaxed">
          <p className="font-medium mb-1">プラン変更について</p>
          <p className="text-[var(--text-sub)]">
            有料プランへの切り替えには本人確認・契約形態のご相談が必要です。
            下記の「お問い合わせ」からご連絡いただくか、
            <a
              href={buildContactMailto()}
              className="text-slate-900 underline underline-offset-2 hover:no-underline"
            >
              {SUBSCRIPTION_CONTACT_EMAIL}
            </a>
            まで直接ご連絡ください。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {VISIBLE_SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isContactPlan = plan.ctaType === "contact";
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

              {isContactPlan && "contactPriceLabel" in plan ? (
                <p className="text-sm font-medium text-[var(--text-main)] mb-4 leading-relaxed">
                  {plan.contactPriceLabel}
                </p>
              ) : (
                <p className="text-2xl font-bold text-[var(--text-main)] mb-1">
                  {plan.priceLabel}
                  <span className="text-sm font-normal text-[var(--text-sub)]">
                    /店舗/月
                  </span>
                </p>
              )}

              {!isContactPlan && "storeRange" in plan && plan.storeRange && (
                <p className="text-sm text-[var(--text-sub)] mb-1">
                  {plan.storeRange}
                </p>
              )}
              {!isContactPlan && "discount" in plan && plan.discount && (
                <p className="text-sm text-green-600 font-medium mb-3">
                  {plan.discount}
                </p>
              )}

              {!isContactPlan && (
                <p className="text-sm text-[var(--text-sub)] mb-4">
                  {plan.description}
                </p>
              )}

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

              {!isCurrent && isContactPlan && (
                <a
                  href={buildContactMailto()}
                  className="block w-full text-center py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  お問い合わせ
                </a>
              )}

              {/*
                可視 + 非 FREE のプランは constants.ts の invariant で必ず
                ctaType="contact" になる (= 上の isContactPlan 分岐に流れる)。
                旧 Stripe Checkout ボタン分岐は到達不能なため削除した。
              */}

              {isCurrent &&
                subscription &&
                "stripeCustomerId" in subscription &&
                subscription.stripeCustomerId && (
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
