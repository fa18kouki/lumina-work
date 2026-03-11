"use client";

import { useState, useMemo, useCallback } from "react";
import { ProfileCompletenessBar } from "./ProfileCompletenessBar";
import { BasicContactSection } from "./BasicContactSection";
import { AttributeSection } from "./AttributeSection";
import { CareerBodySection } from "./CareerBodySection";
import { SurveySection } from "./SurveySection";
import { PreferenceSection } from "./PreferenceSection";
import { WorkHistorySection } from "./WorkHistorySection";
import {
  calculateProfileCompleteness,
  type CastProfileData,
} from "@/lib/profile-completeness";
import { Spinner } from "@/components/ui/spinner";

const TABS = [
  { id: 1, label: "基本情報" },
  { id: 2, label: "属性" },
  { id: 3, label: "キャリア" },
  { id: 4, label: "アンケート" },
  { id: 5, label: "希望条件" },
  { id: 6, label: "職歴" },
] as const;

interface WorkHistory {
  storeName: string;
  hourlyRate: number | null;
  monthlySales: number | null;
  durationMonths: number | null;
  exitDate: string;
  exitReason: string;
  notes: string;
}

interface EmergencyContact {
  relation: string;
  name: string;
  address: string;
}

interface LanguageSkills {
  english: string;
  chinese: string;
  other: string;
}

interface ShiftPreferences {
  days: string;
  dayOfWeek: string;
  workingHours: string;
}

export interface ProfileEditFormData {
  // カテゴリ1
  fullName: string;
  furigana: string;
  gender: string;
  currentArea: string;
  permanentAddress: string;
  phoneNumber: string;
  bloodType: string;
  zodiacSign: string;
  email: string;
  pcEmail: string;
  instagramId: string;
  lineId: string;
  facebookId: string;
  twitterId: string;
  tiktokId: string;
  hobbies: string;
  specialSkills: string;
  medicalConditions: string;
  debt: string;
  qualifications: string;
  interviewDate: string;
  trialDate: string;
  employmentStatus: string;
  emergencyContact: EmergencyContact;

  // カテゴリ2
  livingArrangement: string;
  transportation: string;
  needsPickup: boolean | null;
  hasTattoo: boolean | null;
  dressAvailability: string;
  hasBoyfriend: boolean | null;
  hasHusband: boolean | null;
  hasChildren: boolean | null;

  // カテゴリ3
  currentOccupation: string;
  height: number | null;
  weight: number | null;
  bust: number | null;
  waist: number | null;
  hip: number | null;
  cupSize: string;
  languageSkills: LanguageSkills;
  cosmeticSurgery: string;

  // カテゴリ4
  birthdayEventWillingness: boolean | null;
  photoPublicationConsent: boolean | null;
  familyApproval: boolean | null;

  // カテゴリ5
  desiredAreas: string[];
  desiredHourlyRate: number | null;
  desiredMonthlyIncome: number | null;
  availableDaysPerWeek: number | null;
  alcoholTolerance: string;
  shiftPreferences: ShiftPreferences;
  motivation: string;
  storePreferences: string;
  customerCount: number | null;
  salesTarget: number | null;
  previousStorePerformance: string;
  guaranteedHourlyRate: number | null;
  guaranteePeriod: string;
  specialConditions: string;

  // カテゴリ6
  workHistories: WorkHistory[];
}

interface Props {
  initialData: ProfileEditFormData;
  onSubmit: (data: ProfileEditFormData) => Promise<void>;
  isSaving: boolean;
}

function formToCompletenessData(data: ProfileEditFormData): CastProfileData {
  return {
    fullName: data.fullName || null,
    furigana: data.furigana || null,
    gender: data.gender || null,
    currentArea: data.currentArea || null,
    permanentAddress: data.permanentAddress || null,
    phoneNumber: data.phoneNumber || null,
    bloodType: data.bloodType || null,
    zodiacSign: data.zodiacSign || null,
    email: data.email || null,
    pcEmail: data.pcEmail || null,
    instagramId: data.instagramId || null,
    lineId: data.lineId || null,
    facebookId: data.facebookId || null,
    twitterId: data.twitterId || null,
    tiktokId: data.tiktokId || null,
    hobbies: data.hobbies || null,
    specialSkills: data.specialSkills || null,
    emergencyContact:
      data.emergencyContact?.relation || data.emergencyContact?.name
        ? data.emergencyContact
        : null,
    livingArrangement: data.livingArrangement || null,
    transportation: data.transportation || null,
    needsPickup: data.needsPickup,
    hasTattoo: data.hasTattoo,
    dressAvailability: data.dressAvailability || null,
    hasBoyfriend: data.hasBoyfriend,
    hasHusband: data.hasHusband,
    hasChildren: data.hasChildren,
    currentOccupation: data.currentOccupation || null,
    height: data.height,
    weight: data.weight,
    bust: data.bust,
    waist: data.waist,
    hip: data.hip,
    cupSize: data.cupSize || null,
    languageSkills:
      data.languageSkills?.english ||
      data.languageSkills?.chinese ||
      data.languageSkills?.other
        ? data.languageSkills
        : null,
    cosmeticSurgery: data.cosmeticSurgery || null,
    birthdayEventWillingness: data.birthdayEventWillingness,
    photoPublicationConsent: data.photoPublicationConsent,
    familyApproval: data.familyApproval,
    desiredAreas: data.desiredAreas,
    desiredHourlyRate: data.desiredHourlyRate,
    desiredMonthlyIncome: data.desiredMonthlyIncome,
    availableDaysPerWeek: data.availableDaysPerWeek,
    shiftPreferences:
      data.shiftPreferences?.days ||
      data.shiftPreferences?.dayOfWeek ||
      data.shiftPreferences?.workingHours
        ? data.shiftPreferences
        : null,
    motivation: data.motivation || null,
    storePreferences: data.storePreferences || null,
    guaranteedHourlyRate: data.guaranteedHourlyRate,
    workHistories: data.workHistories.filter((wh) => wh.storeName),
  };
}

export function ProfileEditForm({ initialData, onSubmit, isSaving }: Props) {
  const [activeTab, setActiveTab] = useState(1);
  const [formData, setFormData] = useState<ProfileEditFormData>(initialData);

  const handleFieldChange = useCallback(
    (field: string, value: unknown) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleWorkHistoriesChange = useCallback(
    (histories: WorkHistory[]) => {
      setFormData((prev) => ({ ...prev, workHistories: histories }));
    },
    []
  );

  const completeness = useMemo(
    () => calculateProfileCompleteness(formToCompletenessData(formData)),
    [formData]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ProfileCompletenessBar completeness={completeness} />

      {/* タブナビゲーション */}
      <div className="flex overflow-x-auto gap-1 bg-gray-50 rounded-lg p-1 -mx-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-white text-(--primary) shadow-sm"
                : "text-(--text-sub) hover:text-(--text-main)"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        {activeTab === 1 && (
          <BasicContactSection data={formData} onChange={handleFieldChange} />
        )}
        {activeTab === 2 && (
          <AttributeSection data={formData} onChange={handleFieldChange} />
        )}
        {activeTab === 3 && (
          <CareerBodySection data={formData} onChange={handleFieldChange} />
        )}
        {activeTab === 4 && (
          <SurveySection data={formData} onChange={handleFieldChange} />
        )}
        {activeTab === 5 && (
          <PreferenceSection data={formData} onChange={handleFieldChange} />
        )}
        {activeTab === 6 && (
          <WorkHistorySection
            data={formData.workHistories}
            onChange={handleWorkHistoriesChange}
          />
        )}
      </div>

      {/* 保存ボタン */}
      <div className="sticky bottom-4 z-10">
        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3 rounded-xl text-white font-medium bg-(--primary) hover:bg-(--primary)/90 disabled:opacity-50 transition-colors shadow-lg flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <Spinner size="sm" />
              保存中...
            </>
          ) : (
            "保存する"
          )}
        </button>
      </div>
    </form>
  );
}
