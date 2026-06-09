"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { TextField } from "./_components/TextField";
import { SectionCard } from "./_components/SectionCard";
import { SaveButton } from "./_components/SaveButton";
import { DeleteAccountModal } from "./_components/DeleteAccountModal";

type TabId =
  | "basic"
  | "tax"
  | "address"
  | "billing"
  | "credentials"
  | "referral"
  | "danger";

const TABS: { id: TabId; label: string; danger?: boolean }[] = [
  { id: "basic", label: "基本情報" },
  { id: "tax", label: "法人・税務情報" },
  { id: "address", label: "住所" },
  { id: "billing", label: "請求担当者" },
  { id: "credentials", label: "ログイン情報" },
  { id: "referral", label: "紹介コード" },
  { id: "danger", label: "アカウント削除", danger: true },
];

export default function OwnerSettingsPage() {
  const [tab, setTab] = useState<TabId>("basic");

  const { data: profile, isLoading } = trpc.owner.getProfile.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[var(--text-sub)]">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-[var(--text-main)] mb-6">
        オーナー設定
      </h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* 左サイドタブ */}
        <nav className="md:w-56 shrink-0">
          <ul className="bg-white rounded-xl border border-gray-100 overflow-hidden md:sticky md:top-4">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <li key={t.id}>
                  <button
                    onClick={() => setTab(t.id)}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors border-l-2 ${
                      active
                        ? t.danger
                          ? "bg-red-50 border-red-500 text-red-700 font-semibold"
                          : "bg-slate-50 border-slate-900 text-slate-900 font-semibold"
                        : t.danger
                          ? "border-transparent text-red-600 hover:bg-red-50/50"
                          : "border-transparent text-[var(--text-sub)] hover:bg-gray-50"
                    }`}
                  >
                    {t.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 右コンテンツ */}
        <div className="flex-1 space-y-4 min-w-0">
          {tab === "basic" && (
            <BasicSection
              companyName={profile?.companyName ?? ""}
              representativeName={profile?.representativeName ?? ""}
              representativeFurigana={profile?.representativeFurigana ?? ""}
              representativePhone={profile?.representativePhone ?? ""}
            />
          )}
          {tab === "tax" && (
            <TaxSection
              corporateNumber={profile?.corporateNumber ?? ""}
              invoiceRegistrationNumber={
                profile?.invoiceRegistrationNumber ?? ""
              }
              isVerified={profile?.isVerified ?? false}
            />
          )}
          {tab === "address" && (
            <AddressSection
              headOfficeAddress={profile?.headOfficeAddress ?? ""}
              billingAddress={profile?.billingAddress ?? ""}
            />
          )}
          {tab === "billing" && (
            <BillingSection
              billingContactName={profile?.billingContactName ?? ""}
              billingContactEmail={profile?.billingContactEmail ?? ""}
              billingContactPhone={profile?.billingContactPhone ?? ""}
            />
          )}
          {tab === "credentials" && <CredentialsSection />}
          {tab === "referral" && (
            <ReferralSection referralCode={profile?.referralCode ?? null} />
          )}
          {tab === "danger" && (
            <DangerSection
              hasPaidPlan={
                !!profile?.subscription &&
                profile.subscription.plan !== "FREE"
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ============== 基本情報 ============== */
function BasicSection({
  companyName: initCompany,
  representativeName: initName,
  representativeFurigana: initFurigana,
  representativePhone: initPhone,
}: {
  companyName: string;
  representativeName: string;
  representativeFurigana: string;
  representativePhone: string;
}) {
  const utils = trpc.useUtils();
  const [companyName, setCompanyName] = useState(initCompany);
  const [representativeName, setRepName] = useState(initName);
  const [representativeFurigana, setRepFurigana] = useState(initFurigana);
  const [representativePhone, setRepPhone] = useState(initPhone);

  // profile が遅れて入ってきた場合の同期
  useEffect(() => setCompanyName(initCompany), [initCompany]);
  useEffect(() => setRepName(initName), [initName]);
  useEffect(() => setRepFurigana(initFurigana), [initFurigana]);
  useEffect(() => setRepPhone(initPhone), [initPhone]);

  const mutation = trpc.owner.upsertProfile.useMutation({
    onSuccess: () => utils.owner.getProfile.invalidate(),
  });

  const handleSave = () => {
    mutation.mutate({
      companyName,
      representativeName,
      representativeFurigana,
      representativePhone,
    });
  };

  return (
    <SectionCard
      title="基本情報"
      description="法人名・代表者の連絡先情報。請求書に記載されます。"
    >
      <div className="space-y-4">
        <TextField
          label="法人名・屋号"
          optional
          value={companyName}
          onChange={setCompanyName}
          placeholder="例: 株式会社LUMINAグループ"
          maxLength={200}
        />
        <TextField
          label="代表者名"
          optional
          value={representativeName}
          onChange={setRepName}
          placeholder="例: 山田 太郎"
          maxLength={100}
        />
        <TextField
          label="代表者フリガナ"
          optional
          value={representativeFurigana}
          onChange={setRepFurigana}
          placeholder="例: ヤマダ タロウ"
          maxLength={100}
        />
        <TextField
          label="代表者電話番号"
          optional
          type="tel"
          value={representativePhone}
          onChange={setRepPhone}
          placeholder="例: 03-1234-5678"
          maxLength={30}
        />
        <SaveButton
          isPending={mutation.isPending}
          isSuccess={mutation.isSuccess}
          errorMessage={mutation.error?.message}
          onClick={handleSave}
        />
      </div>
    </SectionCard>
  );
}

/* ============== 法人・税務 ============== */
function TaxSection({
  corporateNumber: initCorp,
  invoiceRegistrationNumber: initInv,
  isVerified,
}: {
  corporateNumber: string;
  invoiceRegistrationNumber: string;
  isVerified: boolean;
}) {
  const utils = trpc.useUtils();
  const [corporateNumber, setCorp] = useState(initCorp);
  const [invoiceRegistrationNumber, setInv] = useState(initInv);

  useEffect(() => setCorp(initCorp), [initCorp]);
  useEffect(() => setInv(initInv), [initInv]);

  const mutation = trpc.owner.upsertProfile.useMutation({
    onSuccess: () => utils.owner.getProfile.invalidate(),
  });

  const handleSave = () => {
    mutation.mutate({ corporateNumber, invoiceRegistrationNumber });
  };

  return (
    <>
      <SectionCard
        title="本人確認"
        description="運営による本人確認のステータスです。"
      >
        <div className="flex items-center gap-3">
          {isVerified ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-200">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              認証済み
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-sm border border-gray-200">
              未認証
            </span>
          )}
          <p className="text-xs text-[var(--text-sub)]">
            認証手続きは運営からの案内をお待ちください。
          </p>
        </div>
      </SectionCard>

      <SectionCard
        title="法人・税務情報"
        description="適格請求書（インボイス）発行に必要な情報です。"
      >
        <div className="space-y-4">
          <TextField
            label="法人番号"
            optional
            value={corporateNumber}
            onChange={setCorp}
            placeholder="例: 1234567890123（13桁）"
            hint="国税庁の法人番号公表サイトで確認できます。"
            maxLength={13}
          />
          <TextField
            label="適格請求書発行事業者登録番号"
            optional
            value={invoiceRegistrationNumber}
            onChange={setInv}
            placeholder="例: T1234567890123"
            hint="T + 13桁。インボイス制度に登録済みの方のみ。"
            maxLength={20}
          />
          <SaveButton
            isPending={mutation.isPending}
            isSuccess={mutation.isSuccess}
            errorMessage={mutation.error?.message}
            onClick={handleSave}
          />
        </div>
      </SectionCard>
    </>
  );
}

/* ============== 住所 ============== */
function AddressSection({
  headOfficeAddress: initHead,
  billingAddress: initBill,
}: {
  headOfficeAddress: string;
  billingAddress: string;
}) {
  const utils = trpc.useUtils();
  const [headOfficeAddress, setHead] = useState(initHead);
  const [billingAddress, setBill] = useState(initBill);

  useEffect(() => setHead(initHead), [initHead]);
  useEffect(() => setBill(initBill), [initBill]);

  const mutation = trpc.owner.upsertProfile.useMutation({
    onSuccess: () => utils.owner.getProfile.invalidate(),
  });

  const handleSave = () => {
    mutation.mutate({ headOfficeAddress, billingAddress });
  };

  return (
    <SectionCard
      title="住所"
      description="本社所在地と請求書送付先（異なる場合のみ）。"
    >
      <div className="space-y-4">
        <TextField
          label="本社・本店所在地"
          optional
          value={headOfficeAddress}
          onChange={setHead}
          placeholder="例: 東京都港区六本木1-2-3"
          maxLength={300}
        />
        <TextField
          label="請求先住所"
          optional
          value={billingAddress}
          onChange={setBill}
          placeholder="本社と同じ場合は空欄で OK"
          hint="本社住所と異なる場合のみ入力してください。"
          maxLength={300}
        />
        <SaveButton
          isPending={mutation.isPending}
          isSuccess={mutation.isSuccess}
          errorMessage={mutation.error?.message}
          onClick={handleSave}
        />
      </div>
    </SectionCard>
  );
}

/* ============== 請求担当者 ============== */
function BillingSection({
  billingContactName: initName,
  billingContactEmail: initEmail,
  billingContactPhone: initPhone,
}: {
  billingContactName: string;
  billingContactEmail: string;
  billingContactPhone: string;
}) {
  const utils = trpc.useUtils();
  const [billingContactName, setName] = useState(initName);
  const [billingContactEmail, setEmail] = useState(initEmail);
  const [billingContactPhone, setPhone] = useState(initPhone);

  useEffect(() => setName(initName), [initName]);
  useEffect(() => setEmail(initEmail), [initEmail]);
  useEffect(() => setPhone(initPhone), [initPhone]);

  const mutation = trpc.owner.upsertProfile.useMutation({
    onSuccess: () => utils.owner.getProfile.invalidate(),
  });

  const handleSave = () => {
    mutation.mutate({
      billingContactName,
      billingContactEmail,
      billingContactPhone,
    });
  };

  return (
    <SectionCard
      title="請求担当者"
      description="代表者と異なる窓口を設定したい場合のみ入力してください。"
    >
      <div className="space-y-4">
        <TextField
          label="担当者名"
          optional
          value={billingContactName}
          onChange={setName}
          placeholder="例: 経理部 鈴木"
          maxLength={100}
        />
        <TextField
          label="担当者メール"
          optional
          type="email"
          value={billingContactEmail}
          onChange={setEmail}
          placeholder="例: billing@example.com"
          maxLength={254}
        />
        <TextField
          label="担当者電話番号"
          optional
          type="tel"
          value={billingContactPhone}
          onChange={setPhone}
          placeholder="例: 03-1234-5678"
          maxLength={30}
        />
        <SaveButton
          isPending={mutation.isPending}
          isSuccess={mutation.isSuccess}
          errorMessage={mutation.error?.message}
          onClick={handleSave}
        />
      </div>
    </SectionCard>
  );
}

/* ============== ログイン情報 ============== */
function CredentialsSection() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const mutation = trpc.owner.updateCredentials.useMutation({
    onSuccess: () => {
      setEmail("");
      setNewPassword("");
      setConfirmPassword("");
      setLocalError(null);
    },
  });

  const handleSave = () => {
    setLocalError(null);
    if (!email.trim() && !newPassword) {
      setLocalError("変更するメールアドレスまたはパスワードを入力してください");
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setLocalError("確認用パスワードが一致しません");
      return;
    }
    mutation.mutate({
      email: email.trim() || undefined,
      newPassword: newPassword || undefined,
    });
  };

  return (
    <SectionCard
      title="ログイン情報"
      description="管理者が発行した仮メール・仮パスワードは、ここから自分の情報へ変更できます。"
    >
      <div className="space-y-4">
        <TextField
          label="新しいログインメール"
          optional
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="新しいメールアドレス"
          maxLength={320}
        />
        <TextField
          label="新しいパスワード"
          optional
          type="password"
          value={newPassword}
          onChange={setNewPassword}
          placeholder="8文字以上"
          maxLength={128}
        />
        <TextField
          label="新しいパスワード（確認）"
          optional
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="同じパスワードを入力"
          maxLength={128}
        />
        {localError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {localError}
          </p>
        )}
        <SaveButton
          isPending={mutation.isPending}
          isSuccess={mutation.isSuccess}
          errorMessage={mutation.error?.message}
          onClick={handleSave}
        />
      </div>
    </SectionCard>
  );
}

/* ============== 紹介コード ============== */
function ReferralSection({ referralCode }: { referralCode: string | null }) {
  const [copied, setCopied] = useState(false);

  const referralUrl = referralCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/o/register?ref=${referralCode}`
    : null;

  const handleCopy = async () => {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard 失敗
    }
  };

  return (
    <SectionCard
      title="紹介コード"
      description="知り合いのオーナーを招待すると、両者に特典が付与されます。"
    >
      {referralCode ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
              あなたの紹介コード
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-slate-900">
                {referralCode}
              </code>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
              紹介リンク
            </label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={referralUrl ?? ""}
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-slate-600 font-mono"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                {copied ? "コピー済" : "コピー"}
              </button>
            </div>
          </div>
          <Link
            href="/o/referral"
            className="inline-flex items-center text-sm text-slate-700 hover:text-slate-900 underline"
          >
            紹介状況の詳細を見る →
          </Link>
        </div>
      ) : (
        <div className="text-sm text-[var(--text-sub)]">
          紹介コードはまだ発行されていません。
          <Link
            href="/o/referral"
            className="ml-2 text-slate-700 hover:text-slate-900 underline"
          >
            紹介ページで発行する →
          </Link>
        </div>
      )}
    </SectionCard>
  );
}

/* ============== アカウント削除 ============== */
function DangerSection({ hasPaidPlan }: { hasPaidPlan: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <SectionCard
        danger
        title="アカウント削除"
        description="退会するとアカウント情報・店舗情報・応募履歴がすべて非公開になります。"
      >
        <div className="space-y-3">
          <ul className="text-sm text-[var(--text-sub)] space-y-1.5 pl-5 list-disc">
            <li>所有店舗の公開ページは即座に閲覧不可になります</li>
            <li>キャストとの進行中のメッセージ・面接予約は管理画面から見えなくなります</li>
            {hasPaidPlan && (
              <li className="text-amber-700">
                有料プランをご利用中の場合、Stripe サブスクリプションを即時キャンセルします
              </li>
            )}
            <li>削除されたデータの復元は管理運営側でのみ対応可能です</li>
          </ul>
          <button
            onClick={() => setOpen(true)}
            className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            アカウントを削除する
          </button>
        </div>
      </SectionCard>

      <DeleteAccountModal
        open={open}
        onClose={() => setOpen(false)}
        hasPaidPlan={hasPaidPlan}
      />
    </>
  );
}
