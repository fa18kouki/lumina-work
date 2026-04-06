"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { StoreSingleImageUploader } from "@/components/store/store-single-image-uploader";
import type { SalarySystem, TrialShiftInfo, WorkConditions, SnsLinks } from "@/lib/types/store";
import {
  BasicInfoSection,
  SalarySection,
  TrialShiftSection,
  WorkConditionsSection,
  BenefitsSection,
  AppealSection,
  SnsSection,
  defaultFormData,
} from "@/components/store/profile-edit";
import type { StoreProfileFormData } from "@/components/store/profile-edit";

export default function StoreProfilePage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = use(params);
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: store, isLoading } = trpc.store.getProfile.useQuery({ storeId });
  const updateProfile = trpc.store.updateProfile.useMutation({
    onSuccess: () => {
      utils.store.getProfile.invalidate({ storeId });
      utils.owner.listStores.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const [form, setForm] = useState<StoreProfileFormData>(defaultFormData);
  const [saved, setSaved] = useState(false);

  const onUpdate = useCallback((partial: Partial<StoreProfileFormData>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  useEffect(() => {
    if (!store) return;

    const s = (store.salarySystem as Record<string, number> | null) ?? {};
    const trial = store.trialShiftInfo as TrialShiftInfo | null;
    const wc = store.workConditions as WorkConditions | null;
    const sns = store.snsLinks as SnsLinks | null;

    setForm({
      name: store.name,
      storeType: (store.storeType as StoreProfileFormData["storeType"]) ?? null,
      area: store.area,
      address: store.address,
      nearestStation: store.nearestStation ?? "",
      walkMinutes: store.walkMinutes ?? null,
      description: store.description ?? "",
      businessHours: store.businessHours ?? "",
      regularHolidays: store.regularHolidays ?? "",
      bannerUrl: store.bannerUrl ?? null,
      logoUrl: store.logoUrl ?? null,
      salary: {
        hourlyRateMin: s.hourlyRateMin ?? 3000,
        hourlyRateMax: s.hourlyRateMax ?? 10000,
        companionBackMin: s.companionBackMin,
        companionBackMax: s.companionBackMax,
        drinkBackMin: s.drinkBackMin,
        drinkBackMax: s.drinkBackMax,
        nominationBackMin: s.nominationBackMin,
        nominationBackMax: s.nominationBackMax,
        floorNominationBackMin: s.floorNominationBackMin,
        floorNominationBackMax: s.floorNominationBackMax,
        salesBackMinPercent: s.salesBackMinPercent,
        salesBackMaxPercent: s.salesBackMaxPercent,
      },
      dailyPayType: (store.dailyPayType as StoreProfileFormData["dailyPayType"]) ?? "NONE",
      signingBonus: store.signingBonus ?? null,
      trialShiftInfo: trial,
      workConditions: wc,
      hasQuota: store.hasQuota,
      drinkingRequired: store.drinkingRequired,
      benefits: store.benefits ?? [],
      hasTransportation: store.hasTransportation,
      transportationDetails: store.transportationDetails ?? "",
      hasDormitory: store.hasDormitory,
      dormitoryDetails: store.dormitoryDetails ?? "",
      hasDressRental: store.hasDressRental,
      hasHairMakeup: store.hasHairMakeup,
      hasNursery: store.hasNursery,
      hasPartnerSalon: store.hasPartnerSalon,
      partnerSalonDetails: store.partnerSalonDetails ?? "",
      atmosphereTags: store.atmosphereTags ?? [],
      castCount: store.castCount ?? null,
      clientele: store.clientele ?? "",
      staffIntroduction: store.staffIntroduction ?? "",
      photos: store.photos ?? [],
      snsLinks: sns,
    });
  }, [store]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({
      storeId,
      name: form.name,
      area: form.area,
      address: form.address,
      description: form.description || undefined,
      bannerUrl: form.bannerUrl,
      logoUrl: form.logoUrl,
      storeType: form.storeType,
      nearestStation: form.nearestStation || undefined,
      walkMinutes: form.walkMinutes,
      regularHolidays: form.regularHolidays || undefined,
      businessHours: form.businessHours || undefined,
      salarySystem: form.salary,
      dailyPayType: form.dailyPayType,
      signingBonus: form.signingBonus,
      trialShiftInfo: form.trialShiftInfo,
      workConditions: form.workConditions,
      hasQuota: form.hasQuota,
      drinkingRequired: form.drinkingRequired,
      benefits: form.benefits,
      hasTransportation: form.hasTransportation,
      transportationDetails: form.transportationDetails || undefined,
      hasDormitory: form.hasDormitory,
      dormitoryDetails: form.dormitoryDetails || undefined,
      hasDressRental: form.hasDressRental,
      hasHairMakeup: form.hasHairMakeup,
      hasNursery: form.hasNursery,
      hasPartnerSalon: form.hasPartnerSalon,
      partnerSalonDetails: form.partnerSalonDetails || undefined,
      atmosphereTags: form.atmosphereTags,
      castCount: form.castCount,
      clientele: form.clientele || undefined,
      staffIntroduction: form.staffIntroduction || undefined,
      snsLinks: form.snsLinks,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[var(--text-sub)]">読み込み中...</div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-sub)]">店舗が見つかりません</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-main)]">店舗情報の編集</h1>
        {saved && (
          <span className="text-sm text-green-600 font-medium">保存しました</span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ビジュアル設定 */}
        <section className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-base font-bold text-[var(--text-main)] mb-1">ビジュアル設定</h2>
          <p className="text-xs text-[var(--text-sub)] mb-5">
            バナーとロゴはキャストに表示される店舗ページに掲載されます
          </p>
          <div className="mb-5">
            <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
              バナー画像 <span className="text-xs text-[var(--text-sub)] font-normal">（推奨：横長 3:1）</span>
            </label>
            <StoreSingleImageUploader
              currentUrl={form.bannerUrl}
              onUrlChange={(url) => onUpdate({ bannerUrl: url })}
              aspectRatio="banner"
              placeholder="/service-scene-10.png"
              deleteType="banner"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
              ロゴ・アイコン <span className="text-xs text-[var(--text-sub)] font-normal">（正方形推奨）</span>
            </label>
            <StoreSingleImageUploader
              currentUrl={form.logoUrl}
              onUrlChange={(url) => onUpdate({ logoUrl: url })}
              aspectRatio="logo"
              placeholder="/service-scene-01.png"
              deleteType="logo"
            />
          </div>
        </section>

        <BasicInfoSection form={form} onUpdate={onUpdate} />
        <SalarySection form={form} onUpdate={onUpdate} />
        <TrialShiftSection form={form} onUpdate={onUpdate} />
        <WorkConditionsSection form={form} onUpdate={onUpdate} />
        <BenefitsSection form={form} onUpdate={onUpdate} />
        <AppealSection form={form} onUpdate={onUpdate} />
        <SnsSection form={form} onUpdate={onUpdate} />

        {/* 送信 */}
        <div className="flex items-center gap-3 justify-end pt-2">
          <Button type="button" variant="outline" onClick={() => router.push(`/o/stores/${storeId}`)}>
            キャンセル
          </Button>
          <Button type="submit" disabled={updateProfile.isPending || !form.name || !form.area || !form.address}>
            <Save className="w-4 h-4 mr-1.5" />
            {updateProfile.isPending ? "保存中..." : "保存する"}
          </Button>
        </div>

        {updateProfile.error && (
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-700">{updateProfile.error.message}</p>
          </div>
        )}
      </form>
    </div>
  );
}
