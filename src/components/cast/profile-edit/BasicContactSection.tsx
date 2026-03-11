"use client";

import {
  BLOOD_TYPES,
  ZODIAC_SIGNS,
  GENDER_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
} from "@/lib/constants";

interface EmergencyContact {
  relation: string;
  name: string;
  address: string;
}

interface Props {
  data: {
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
  };
  onChange: (field: string, value: unknown) => void;
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-(--text-main) mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-(--text-main) focus:outline-none focus:ring-2 focus:ring-(--primary)/30 focus:border-(--primary)";

const selectClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-(--text-main) bg-white focus:outline-none focus:ring-2 focus:ring-(--primary)/30 focus:border-(--primary)";

export function BasicContactSection({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-(--text-main) border-b border-gray-100 pb-2">
        基本情報
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="氏名（本名）">
          <input
            type="text"
            className={inputClass}
            value={data.fullName}
            onChange={(e) => onChange("fullName", e.target.value)}
            placeholder="山田 花子"
          />
        </FormField>

        <FormField label="フリガナ">
          <input
            type="text"
            className={inputClass}
            value={data.furigana}
            onChange={(e) => onChange("furigana", e.target.value)}
            placeholder="ヤマダ ハナコ"
          />
        </FormField>

        <FormField label="性別">
          <select
            className={selectClass}
            value={data.gender}
            onChange={(e) => onChange("gender", e.target.value)}
          >
            <option value="">選択してください</option>
            {GENDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="血液型">
          <select
            className={selectClass}
            value={data.bloodType}
            onChange={(e) => onChange("bloodType", e.target.value)}
          >
            <option value="">選択してください</option>
            {BLOOD_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="干支">
          <select
            className={selectClass}
            value={data.zodiacSign}
            onChange={(e) => onChange("zodiacSign", e.target.value)}
          >
            <option value="">選択してください</option>
            {ZODIAC_SIGNS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="在籍状況">
          <select
            className={selectClass}
            value={data.employmentStatus}
            onChange={(e) => onChange("employmentStatus", e.target.value)}
          >
            <option value="">選択してください</option>
            {EMPLOYMENT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <h3 className="text-base font-semibold text-(--text-main) border-b border-gray-100 pb-2 pt-2">
        連絡先
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="電話番号">
          <input
            type="tel"
            className={inputClass}
            value={data.phoneNumber}
            onChange={(e) => onChange("phoneNumber", e.target.value)}
            placeholder="090-1234-5678"
          />
        </FormField>

        <FormField label="メールアドレス">
          <input
            type="email"
            className={inputClass}
            value={data.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="example@mail.com"
          />
        </FormField>

        <FormField label="PCメールアドレス">
          <input
            type="email"
            className={inputClass}
            value={data.pcEmail}
            onChange={(e) => onChange("pcEmail", e.target.value)}
            placeholder="example@pc-mail.com"
          />
        </FormField>

        <FormField label="現住所エリア">
          <input
            type="text"
            className={inputClass}
            value={data.currentArea}
            onChange={(e) => onChange("currentArea", e.target.value)}
            placeholder="東京都港区"
          />
        </FormField>

        <FormField label="本籍地">
          <input
            type="text"
            className={inputClass}
            value={data.permanentAddress}
            onChange={(e) => onChange("permanentAddress", e.target.value)}
            placeholder="東京都"
          />
        </FormField>
      </div>

      <h3 className="text-base font-semibold text-(--text-main) border-b border-gray-100 pb-2 pt-2">
        SNS
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Instagram ID">
          <input
            type="text"
            className={inputClass}
            value={data.instagramId}
            onChange={(e) => onChange("instagramId", e.target.value)}
            placeholder="@username"
          />
        </FormField>

        <FormField label="LINE ID">
          <input
            type="text"
            className={inputClass}
            value={data.lineId}
            onChange={(e) => onChange("lineId", e.target.value)}
          />
        </FormField>

        <FormField label="X (Twitter) ID">
          <input
            type="text"
            className={inputClass}
            value={data.twitterId}
            onChange={(e) => onChange("twitterId", e.target.value)}
            placeholder="@username"
          />
        </FormField>

        <FormField label="TikTok ID">
          <input
            type="text"
            className={inputClass}
            value={data.tiktokId}
            onChange={(e) => onChange("tiktokId", e.target.value)}
            placeholder="@username"
          />
        </FormField>

        <FormField label="Facebook ID">
          <input
            type="text"
            className={inputClass}
            value={data.facebookId}
            onChange={(e) => onChange("facebookId", e.target.value)}
          />
        </FormField>
      </div>

      <h3 className="text-base font-semibold text-(--text-main) border-b border-gray-100 pb-2 pt-2">
        その他
      </h3>

      <div className="grid grid-cols-1 gap-4">
        <FormField label="趣味">
          <textarea
            className={`${inputClass} min-h-[60px]`}
            value={data.hobbies}
            onChange={(e) => onChange("hobbies", e.target.value)}
            placeholder="映画鑑賞、旅行など"
          />
        </FormField>

        <FormField label="特技">
          <textarea
            className={`${inputClass} min-h-[60px]`}
            value={data.specialSkills}
            onChange={(e) => onChange("specialSkills", e.target.value)}
            placeholder="英会話、料理など"
          />
        </FormField>

        <FormField label="資格">
          <input
            type="text"
            className={inputClass}
            value={data.qualifications}
            onChange={(e) => onChange("qualifications", e.target.value)}
          />
        </FormField>

        <FormField label="持病・通院歴">
          <input
            type="text"
            className={inputClass}
            value={data.medicalConditions}
            onChange={(e) => onChange("medicalConditions", e.target.value)}
          />
        </FormField>

        <FormField label="借入・ローン">
          <input
            type="text"
            className={inputClass}
            value={data.debt}
            onChange={(e) => onChange("debt", e.target.value)}
          />
        </FormField>
      </div>

      <h3 className="text-base font-semibold text-(--text-main) border-b border-gray-100 pb-2 pt-2">
        面接日程
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="面接日">
          <input
            type="date"
            className={inputClass}
            value={data.interviewDate}
            onChange={(e) => onChange("interviewDate", e.target.value)}
          />
        </FormField>

        <FormField label="体験日">
          <input
            type="date"
            className={inputClass}
            value={data.trialDate}
            onChange={(e) => onChange("trialDate", e.target.value)}
          />
        </FormField>
      </div>

      <h3 className="text-base font-semibold text-(--text-main) border-b border-gray-100 pb-2 pt-2">
        緊急連絡先
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="続柄">
          <input
            type="text"
            className={inputClass}
            value={data.emergencyContact?.relation ?? ""}
            onChange={(e) =>
              onChange("emergencyContact", {
                ...data.emergencyContact,
                relation: e.target.value,
              })
            }
            placeholder="母"
          />
        </FormField>

        <FormField label="氏名">
          <input
            type="text"
            className={inputClass}
            value={data.emergencyContact?.name ?? ""}
            onChange={(e) =>
              onChange("emergencyContact", {
                ...data.emergencyContact,
                name: e.target.value,
              })
            }
          />
        </FormField>

        <FormField label="住所">
          <input
            type="text"
            className={inputClass}
            value={data.emergencyContact?.address ?? ""}
            onChange={(e) =>
              onChange("emergencyContact", {
                ...data.emergencyContact,
                address: e.target.value,
              })
            }
          />
        </FormField>
      </div>
    </div>
  );
}
