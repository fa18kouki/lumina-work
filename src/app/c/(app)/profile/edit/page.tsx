"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAppSession } from "@/lib/auth-helpers";
import { trpc } from "@/lib/trpc";
import { Spinner } from "@/components/ui/spinner";
import {
  ProfileEditForm,
  type ProfileEditFormData,
} from "@/components/cast/profile-edit/ProfileEditForm";

function profileToFormData(profile: Record<string, unknown>): ProfileEditFormData {
  const ec = profile.emergencyContact as Record<string, string> | null;
  const ls = profile.languageSkills as Record<string, string> | null;
  const sp = profile.shiftPreferences as Record<string, string> | null;
  const wh = (profile.workHistories ?? []) as Array<Record<string, unknown>>;

  return {
    // カテゴリ1
    fullName: (profile.fullName as string) ?? "",
    furigana: (profile.furigana as string) ?? "",
    gender: (profile.gender as string) ?? "",
    currentArea: (profile.currentArea as string) ?? "",
    permanentAddress: (profile.permanentAddress as string) ?? "",
    phoneNumber: (profile.phoneNumber as string) ?? "",
    bloodType: (profile.bloodType as string) ?? "",
    zodiacSign: (profile.zodiacSign as string) ?? "",
    email: (profile.email as string) ?? "",
    pcEmail: (profile.pcEmail as string) ?? "",
    instagramId: (profile.instagramId as string) ?? "",
    lineId: (profile.lineId as string) ?? "",
    facebookId: (profile.facebookId as string) ?? "",
    twitterId: (profile.twitterId as string) ?? "",
    tiktokId: (profile.tiktokId as string) ?? "",
    hobbies: (profile.hobbies as string) ?? "",
    specialSkills: (profile.specialSkills as string) ?? "",
    medicalConditions: (profile.medicalConditions as string) ?? "",
    debt: (profile.debt as string) ?? "",
    qualifications: (profile.qualifications as string) ?? "",
    interviewDate: profile.interviewDate
      ? new Date(profile.interviewDate as string).toISOString().split("T")[0]
      : "",
    trialDate: profile.trialDate
      ? new Date(profile.trialDate as string).toISOString().split("T")[0]
      : "",
    employmentStatus: (profile.employmentStatus as string) ?? "",
    emergencyContact: {
      relation: ec?.relation ?? "",
      name: ec?.name ?? "",
      address: ec?.address ?? "",
    },

    // カテゴリ2
    livingArrangement: (profile.livingArrangement as string) ?? "",
    transportation: (profile.transportation as string) ?? "",
    needsPickup: profile.needsPickup as boolean | null,
    hasTattoo: profile.hasTattoo as boolean | null,
    dressAvailability: (profile.dressAvailability as string) ?? "",
    hasBoyfriend: profile.hasBoyfriend as boolean | null,
    hasHusband: profile.hasHusband as boolean | null,
    hasChildren: profile.hasChildren as boolean | null,

    // カテゴリ3
    currentOccupation: (profile.currentOccupation as string) ?? "",
    height: profile.height as number | null,
    weight: profile.weight as number | null,
    bust: profile.bust as number | null,
    waist: profile.waist as number | null,
    hip: profile.hip as number | null,
    cupSize: (profile.cupSize as string) ?? "",
    languageSkills: {
      english: ls?.english ?? "",
      chinese: ls?.chinese ?? "",
      other: ls?.other ?? "",
    },
    cosmeticSurgery: (profile.cosmeticSurgery as string) ?? "",

    // カテゴリ4
    birthdayEventWillingness: profile.birthdayEventWillingness as boolean | null,
    photoPublicationConsent: profile.photoPublicationConsent as boolean | null,
    familyApproval: profile.familyApproval as boolean | null,

    // カテゴリ5
    desiredAreas: (profile.desiredAreas as string[]) ?? [],
    desiredHourlyRate: profile.desiredHourlyRate as number | null,
    desiredMonthlyIncome: profile.desiredMonthlyIncome as number | null,
    availableDaysPerWeek: profile.availableDaysPerWeek as number | null,
    alcoholTolerance: (profile.alcoholTolerance as string) ?? "",
    shiftPreferences: {
      days: sp?.days ?? "",
      dayOfWeek: sp?.dayOfWeek ?? "",
      workingHours: sp?.workingHours ?? "",
    },
    motivation: (profile.motivation as string) ?? "",
    storePreferences: (profile.storePreferences as string) ?? "",
    customerCount: profile.customerCount as number | null,
    salesTarget: profile.salesTarget as number | null,
    previousStorePerformance: (profile.previousStorePerformance as string) ?? "",
    guaranteedHourlyRate: profile.guaranteedHourlyRate as number | null,
    guaranteePeriod: (profile.guaranteePeriod as string) ?? "",
    specialConditions: (profile.specialConditions as string) ?? "",

    // カテゴリ6
    workHistories: wh.map((w) => ({
      storeName: (w.storeName as string) ?? "",
      hourlyRate: w.hourlyRate as number | null,
      monthlySales: w.monthlySales as number | null,
      durationMonths: w.durationMonths as number | null,
      exitDate: (w.exitDate as string) ?? "",
      exitReason: (w.exitReason as string) ?? "",
      notes: (w.notes as string) ?? "",
    })),
  };
}

export default function CastProfileEditPage() {
  const router = useRouter();
  const { data: session, status } = useAppSession();
  const { data: profile, isLoading } = trpc.cast.getProfile.useQuery();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/c/login");
    else if (session && session.user.role !== "CAST") router.push("/c/login");
  }, [session, status, router]);

  const upsertProfile = trpc.cast.upsertProfile.useMutation({
    onSuccess: () => {
      utils.cast.getProfile.invalidate();
    },
  });

  const handleSubmit = async (data: ProfileEditFormData) => {


    // 空文字列→undefined変換（APIのzodスキーマ対応）
    const cleanStr = (v: string) => v || undefined;
    const cleanEmail = (v: string) => (v ? v : undefined);

    // emergencyContactが全て空ならundefined
    const ec =
      data.emergencyContact.relation ||
      data.emergencyContact.name ||
      data.emergencyContact.address
        ? data.emergencyContact
        : undefined;

    // languageSkillsが全て空ならundefined
    const ls =
      data.languageSkills.english ||
      data.languageSkills.chinese ||
      data.languageSkills.other
        ? data.languageSkills
        : undefined;

    // shiftPreferencesが全て空ならundefined
    const sp =
      data.shiftPreferences.days ||
      data.shiftPreferences.dayOfWeek ||
      data.shiftPreferences.workingHours
        ? data.shiftPreferences
        : undefined;

    await upsertProfile.mutateAsync({
      // 既存ウィザードのフィールド（必須）
      nickname: profile?.nickname ?? "ゲスト",
      age: profile?.age ?? 18,
      birthDate: profile?.birthDate?.toISOString().split("T")[0],
      description: profile?.description ?? undefined,
      photos: profile?.photos ?? [],

      // カテゴリ1
      fullName: cleanStr(data.fullName),
      furigana: cleanStr(data.furigana),
      gender: cleanStr(data.gender),
      currentArea: cleanStr(data.currentArea),
      permanentAddress: cleanStr(data.permanentAddress),
      phoneNumber: cleanStr(data.phoneNumber),
      bloodType: cleanStr(data.bloodType),
      zodiacSign: cleanStr(data.zodiacSign),
      email: cleanEmail(data.email),
      pcEmail: cleanEmail(data.pcEmail),
      instagramId: cleanStr(data.instagramId),
      lineId: cleanStr(data.lineId),
      facebookId: cleanStr(data.facebookId),
      twitterId: cleanStr(data.twitterId),
      tiktokId: cleanStr(data.tiktokId),
      hobbies: cleanStr(data.hobbies),
      specialSkills: cleanStr(data.specialSkills),
      medicalConditions: cleanStr(data.medicalConditions),
      debt: cleanStr(data.debt),
      qualifications: cleanStr(data.qualifications),
      interviewDate: cleanStr(data.interviewDate),
      trialDate: cleanStr(data.trialDate),
      employmentStatus: data.employmentStatus
        ? (data.employmentStatus as "INTERVIEW_ONLY" | "TRIAL" | "EMPLOYED" | "RESIGNED")
        : undefined,
      emergencyContact: ec as Record<string, unknown> | undefined,

      // カテゴリ2
      livingArrangement: data.livingArrangement
        ? (data.livingArrangement as "WITH_FAMILY" | "ALONE" | "OTHER")
        : undefined,
      transportation: data.transportation
        ? (data.transportation as "CAR" | "TRAIN" | "OTHER")
        : undefined,
      needsPickup: data.needsPickup ?? undefined,
      hasTattoo: data.hasTattoo ?? undefined,
      dressAvailability: data.dressAvailability
        ? (data.dressAvailability as "OWNED" | "RENTAL")
        : undefined,
      hasBoyfriend: data.hasBoyfriend ?? undefined,
      hasHusband: data.hasHusband ?? undefined,
      hasChildren: data.hasChildren ?? undefined,

      // カテゴリ3
      currentOccupation: cleanStr(data.currentOccupation),
      height: data.height ?? undefined,
      weight: data.weight ?? undefined,
      bust: data.bust ?? undefined,
      waist: data.waist ?? undefined,
      hip: data.hip ?? undefined,
      cupSize: cleanStr(data.cupSize),
      languageSkills: ls as Record<string, unknown> | undefined,
      cosmeticSurgery: cleanStr(data.cosmeticSurgery),

      // カテゴリ4
      birthdayEventWillingness: data.birthdayEventWillingness ?? undefined,
      photoPublicationConsent: data.photoPublicationConsent ?? undefined,
      familyApproval: data.familyApproval ?? undefined,

      // カテゴリ5
      desiredAreas: data.desiredAreas.length > 0 ? data.desiredAreas : undefined,
      desiredHourlyRate: data.desiredHourlyRate ?? undefined,
      desiredMonthlyIncome: data.desiredMonthlyIncome ?? undefined,
      availableDaysPerWeek: data.availableDaysPerWeek ?? undefined,
      alcoholTolerance: data.alcoholTolerance
        ? (data.alcoholTolerance as "NONE" | "WEAK" | "MODERATE" | "STRONG" | "NG")
        : undefined,
      shiftPreferences: sp as Record<string, unknown> | undefined,
      motivation: cleanStr(data.motivation),
      storePreferences: cleanStr(data.storePreferences),
      customerCount: data.customerCount ?? undefined,
      salesTarget: data.salesTarget ?? undefined,
      previousStorePerformance: cleanStr(data.previousStorePerformance),
      guaranteedHourlyRate: data.guaranteedHourlyRate ?? undefined,
      guaranteePeriod: cleanStr(data.guaranteePeriod),
      specialConditions: cleanStr(data.specialConditions),

      // カテゴリ6: 職歴
      workHistories: data.workHistories
        .filter((wh) => wh.storeName)
        .map((wh) => ({
          storeName: wh.storeName,
          hourlyRate: wh.hourlyRate ?? undefined,
          monthlySales: wh.monthlySales ?? undefined,
          durationMonths: wh.durationMonths ?? undefined,
          exitDate: wh.exitDate || undefined,
          exitReason: wh.exitReason || undefined,
          notes: wh.notes || undefined,
        })),
    });
  };

  if (
    status === "loading" ||
    !session ||
    session.user.role !== "CAST" ||
    isLoading
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  const emptyFormData: ProfileEditFormData = {
    fullName: "", furigana: "", gender: "", currentArea: "", permanentAddress: "",
    phoneNumber: "", bloodType: "", zodiacSign: "", email: "", pcEmail: "",
    instagramId: "", lineId: "", facebookId: "", twitterId: "", tiktokId: "",
    hobbies: "", specialSkills: "", medicalConditions: "", debt: "", qualifications: "",
    interviewDate: "", trialDate: "", employmentStatus: "",
    emergencyContact: { relation: "", name: "", address: "" },
    livingArrangement: "", transportation: "", needsPickup: null, hasTattoo: null,
    dressAvailability: "", hasBoyfriend: null, hasHusband: null, hasChildren: null,
    currentOccupation: "", height: null, weight: null, bust: null, waist: null, hip: null,
    cupSize: "", languageSkills: { english: "", chinese: "", other: "" }, cosmeticSurgery: "",
    birthdayEventWillingness: null, photoPublicationConsent: null, familyApproval: null,
    desiredAreas: [], desiredHourlyRate: null, desiredMonthlyIncome: null,
    availableDaysPerWeek: null, alcoholTolerance: "",
    shiftPreferences: { days: "", dayOfWeek: "", workingHours: "" },
    motivation: "", storePreferences: "", customerCount: null, salesTarget: null,
    previousStorePerformance: "", guaranteedHourlyRate: null, guaranteePeriod: "",
    specialConditions: "", workHistories: [],
  };

  const initialFormData = profile
    ? profileToFormData(profile as unknown as Record<string, unknown>)
    : emptyFormData;

  return (
    <div className="min-h-screen bg-(--bg-gray)">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* ヘッダー */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-(--text-main)" />
          </button>
          <h1 className="text-lg font-semibold text-(--text-main)">
            プロフィール詳細
          </h1>
        </div>

        <ProfileEditForm
          initialData={initialFormData}
          onSubmit={handleSubmit}
          isSaving={upsertProfile.isPending}
        />

        {upsertProfile.isSuccess && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-medium z-50 animate-fade-in">
            保存しました
          </div>
        )}
      </div>
    </div>
  );
}
