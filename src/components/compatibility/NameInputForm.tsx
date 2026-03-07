"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import type { BloodType, CompatibilityInput } from "@/lib/compatibility/calculate";

interface NameInputFormProps {
  onSubmit: (data: CompatibilityInput) => void;
}

const BLOOD_TYPES: BloodType[] = ["A", "B", "O", "AB"];

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

function PersonInput({
  label,
  nameId,
  name,
  onNameChange,
  month,
  onMonthChange,
  day,
  onDayChange,
  bloodType,
  onBloodTypeChange,
}: {
  label: string;
  nameId: string;
  name: string;
  onNameChange: (v: string) => void;
  month: number;
  onMonthChange: (v: number) => void;
  day: number;
  onDayChange: (v: number) => void;
  bloodType: BloodType;
  onBloodTypeChange: (v: BloodType) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-(--text-main)">{label}</p>
      <div>
        <label
          htmlFor={nameId}
          className="block text-xs text-(--text-sub) mb-1"
        >
          名前
        </label>
        <input
          id={nameId}
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="名前を入力"
          maxLength={20}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-(--text-main) placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent transition-shadow text-sm"
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs text-(--text-sub) mb-1">
            生年月日
          </label>
          <div className="flex gap-2">
            <select
              value={month}
              onChange={(e) => onMonthChange(Number(e.target.value))}
              className="flex-1 px-2 py-2.5 rounded-lg border border-gray-200 bg-white text-(--text-main) focus:outline-none focus:ring-2 focus:ring-(--primary) text-sm"
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}月
                </option>
              ))}
            </select>
            <select
              value={day}
              onChange={(e) => onDayChange(Number(e.target.value))}
              className="flex-1 px-2 py-2.5 rounded-lg border border-gray-200 bg-white text-(--text-main) focus:outline-none focus:ring-2 focus:ring-(--primary) text-sm"
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}日
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-(--text-sub) mb-1">
            血液型
          </label>
          <div className="flex gap-1">
            {BLOOD_TYPES.map((bt) => (
              <button
                key={bt}
                type="button"
                onClick={() => onBloodTypeChange(bt)}
                className={`px-2.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  bloodType === bt
                    ? "bg-(--primary) text-white"
                    : "bg-gray-100 text-(--text-sub) hover:bg-gray-200"
                }`}
              >
                {bt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function NameInputForm({ onSubmit }: NameInputFormProps) {
  const [name1, setName1] = useState("");
  const [month1, setMonth1] = useState(1);
  const [day1, setDay1] = useState(1);
  const [bloodType1, setBloodType1] = useState<BloodType>("A");

  const [name2, setName2] = useState("");
  const [month2, setMonth2] = useState(1);
  const [day2, setDay2] = useState(1);
  const [bloodType2, setBloodType2] = useState<BloodType>("A");

  const canSubmit = name1.trim().length > 0 && name2.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      onSubmit({
        name1: name1.trim(),
        month1,
        day1,
        bloodType1,
        name2: name2.trim(),
        month2,
        day2,
        bloodType2,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-full bg-(--primary-bg) flex items-center justify-center">
          <Heart className="w-8 h-8 text-(--primary)" />
        </div>
        <h1 className="text-xl font-bold text-(--text-main)">相性占い</h1>
        <p className="text-sm text-(--text-sub)">
          名前・生年月日・血液型から相性を占います
        </p>
      </div>

      <div className="space-y-4">
        <PersonInput
          label="あなた"
          nameId="name1"
          name={name1}
          onNameChange={setName1}
          month={month1}
          onMonthChange={setMonth1}
          day={day1}
          onDayChange={setDay1}
          bloodType={bloodType1}
          onBloodTypeChange={setBloodType1}
        />

        <div className="flex justify-center">
          <span className="text-2xl">×</span>
        </div>

        <PersonInput
          label="お相手"
          nameId="name2"
          name={name2}
          onNameChange={setName2}
          month={month2}
          onMonthChange={setMonth2}
          day={day2}
          onDayChange={setDay2}
          bloodType={bloodType2}
          onBloodTypeChange={setBloodType2}
        />
      </div>

      <Button
        type="submit"
        disabled={!canSubmit}
        className="w-full py-3 text-base"
      >
        <Heart className="w-5 h-5 mr-2" />
        占う
      </Button>
    </form>
  );
}
