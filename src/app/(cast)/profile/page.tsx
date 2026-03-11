"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSession } from "@/lib/auth-helpers";
import { trpc } from "@/lib/trpc";
import { Spinner } from "@/components/ui/spinner";
import { ProfileWizard, type ProfileFormData } from "@/components/cast/ProfileWizard";

export default function CastProfilePage() {
  const router = useRouter();
  const { data: session, status } = useAppSession();
  const { data: profile, isLoading } = trpc.cast.getProfile.useQuery();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (session && session.user.role !== "CAST") router.push("/login");
  }, [session, status, router]);

  // プロフィール登録済みの場合は詳細編集ページへリダイレクト
  useEffect(() => {
    if (profile) {
      router.replace("/profile/edit");
    }
  }, [profile, router]);

  const upsertProfile = trpc.cast.upsertProfile.useMutation({
    onSuccess: () => {
      utils.cast.getProfile.invalidate();
      router.push("/dashboard");
    },
  });

  const handleSubmit = async (data: ProfileFormData) => {
    await upsertProfile.mutateAsync({
      // 基本情報
      nickname: data.nickname,
      age: data.age,
      birthDate: data.birthDate || undefined,
      description: data.description || undefined,
      photos: data.photos,

      // 連絡先
      instagramId: data.instagramId || undefined,
      lineId: data.lineId || undefined,
      currentListingUrl: data.currentListingUrl || undefined,

      // 経験・スキル
      experiences: data.experiences.filter((e) => e.area), // 空のエリアは除外
      totalExperienceYears: data.totalExperienceYears,
      previousHourlyRate: data.previousHourlyRate,
      monthlySales: data.monthlySales,
      monthlyNominations: data.monthlyNominations,
      alcoholTolerance: data.alcoholTolerance,

      // 希望条件
      desiredAreas: data.desiredAreas || [],
      desiredHourlyRate: data.desiredHourlyRate,
      desiredMonthlyIncome: data.desiredMonthlyIncome,
      availableDaysPerWeek: data.availableDaysPerWeek,
      preferredAtmosphere: data.preferredAtmosphere || [],
      preferredClientele: data.preferredClientele || [],

      // リスク回避
      downtimeUntil: data.downtimeUntil || undefined,
      isAvailableNow: data.isAvailableNow,

      // 自己PR
      birthdaySales: data.birthdaySales,
      hasVipClients: data.hasVipClients,
      vipClientDescription: data.vipClientDescription || undefined,
      socialFollowers: data.socialFollowers,
    });
  };

  const handleCancel = () => {
    router.back();
  };

  if (status === "loading" || !session || session.user.role !== "CAST" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  // 既存のプロフィールデータをProfileFormData形式に変換
  const initialData: Partial<ProfileFormData> | undefined = profile
    ? {
        nickname: profile.nickname,
        age: profile.age,
        birthDate: profile.birthDate?.toISOString().split("T")[0],
        description: profile.description ?? undefined,
        photos: profile.photos,
        instagramId: profile.instagramId ?? undefined,
        lineId: profile.lineId ?? undefined,
        currentListingUrl: profile.currentListingUrl ?? undefined,
        experiences: profile.experiences?.map((e) => ({
          area: e.area,
          businessType: e.businessType as ProfileFormData["experiences"][0]["businessType"],
          durationMonths: e.durationMonths ?? undefined,
        })) ?? [],
        totalExperienceYears: profile.totalExperienceYears ?? undefined,
        previousHourlyRate: profile.previousHourlyRate ?? undefined,
        monthlySales: profile.monthlySales ?? undefined,
        monthlyNominations: profile.monthlyNominations ?? undefined,
        alcoholTolerance: profile.alcoholTolerance as ProfileFormData["alcoholTolerance"],
        desiredAreas: profile.desiredAreas,
        desiredHourlyRate: profile.desiredHourlyRate ?? undefined,
        desiredMonthlyIncome: profile.desiredMonthlyIncome ?? undefined,
        availableDaysPerWeek: profile.availableDaysPerWeek ?? undefined,
        preferredAtmosphere: profile.preferredAtmosphere,
        preferredClientele: profile.preferredClientele,
        downtimeUntil: profile.downtimeUntil?.toISOString().split("T")[0],
        isAvailableNow: profile.isAvailableNow,
        birthdaySales: profile.birthdaySales ?? undefined,
        hasVipClients: profile.hasVipClients,
        vipClientDescription: profile.vipClientDescription ?? undefined,
        socialFollowers: profile.socialFollowers ?? undefined,
      }
    : undefined;

  return (
    <ProfileWizard
      initialData={initialData}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
