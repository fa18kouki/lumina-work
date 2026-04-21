// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  ProfileEditForm,
  type ProfileEditFormData,
} from "@/components/cast/profile-edit/ProfileEditForm";

const emptyFormData: ProfileEditFormData = {
  fullName: "",
  furigana: "",
  age: null,
  gender: "",
  currentArea: "",
  permanentAddress: "",
  phoneNumber: "",
  bloodType: "",
  zodiacSign: "",
  email: "",
  pcEmail: "",
  instagramId: "",
  lineId: "",
  facebookId: "",
  twitterId: "",
  tiktokId: "",
  hobbies: "",
  specialSkills: "",
  medicalConditions: "",
  debt: "",
  qualifications: "",
  interviewDate: "",
  trialDate: "",
  employmentStatus: "",
  emergencyContact: { relation: "", name: "", address: "" },
  livingArrangement: "",
  transportation: "",
  needsPickup: null,
  hasTattoo: null,
  dressAvailability: "",
  hasBoyfriend: null,
  hasHusband: null,
  hasChildren: null,
  currentOccupation: "",
  height: null,
  weight: null,
  bust: null,
  waist: null,
  hip: null,
  cupSize: "",
  languageSkills: { english: "", chinese: "", other: "" },
  cosmeticSurgery: "",
  birthdayEventWillingness: null,
  photoPublicationConsent: null,
  familyApproval: null,
  desiredAreas: [],
  desiredHourlyRate: null,
  desiredMonthlyIncome: null,
  availableDaysPerWeek: null,
  alcoholTolerance: "",
  shiftPreferences: { days: "", dayOfWeek: "", workingHours: "" },
  motivation: "",
  storePreferences: "",
  customerCount: null,
  salesTarget: null,
  previousStorePerformance: "",
  guaranteedHourlyRate: null,
  guaranteePeriod: "",
  specialConditions: "",
  workHistories: [],
  photos: [],
};

describe("ProfileEditForm 写真タブ", () => {
  it("タブ一覧に『写真』が含まれる", () => {
    render(
      <ProfileEditForm
        initialData={emptyFormData}
        onSubmit={async () => {}}
        isSaving={false}
      />
    );
    expect(screen.getByRole("button", { name: "写真" })).toBeInTheDocument();
  });

  it("『写真』タブをクリックすると PhotoUploader が表示される", () => {
    render(
      <ProfileEditForm
        initialData={emptyFormData}
        onSubmit={async () => {}}
        isSaving={false}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "写真" }));
    // PhotoUploader の固有文言でアップローダの描画を確認
    expect(screen.getByText(/JPG, PNG, WebP/)).toBeInTheDocument();
  });
});
