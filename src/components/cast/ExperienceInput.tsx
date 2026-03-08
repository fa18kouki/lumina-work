"use client";

import { Plus, X } from "lucide-react";
import { BUSINESS_TYPES, type BusinessType } from "@/lib/constants";
import { AreaSelect } from "@/components/ui/area-select";

export type { BusinessType };

export interface Experience {
  area: string;
  businessType: BusinessType;
  durationMonths?: number;
}

interface ExperienceInputProps {
  experiences: Experience[];
  onExperiencesChange: (experiences: Experience[]) => void;
}


export function ExperienceInput({
  experiences,
  onExperiencesChange,
}: ExperienceInputProps) {
  const handleAddExperience = () => {
    onExperiencesChange([
      ...experiences,
      { area: "", businessType: "CABARET", durationMonths: undefined },
    ]);
  };

  const handleRemoveExperience = (index: number) => {
    onExperiencesChange(experiences.filter((_, i) => i !== index));
  };

  const handleUpdateExperience = (
    index: number,
    field: keyof Experience,
    value: string | number | undefined
  ) => {
    const updated = experiences.map((exp, i) => {
      if (i !== index) return exp;
      return { ...exp, [field]: value };
    });
    onExperiencesChange(updated);
  };

  return (
    <div className="space-y-4">
      {experiences.map((exp, index) => (
        <div
          key={index}
          className="relative rounded-lg border border-gray-200 bg-white p-4"
        >
          <button
            type="button"
            onClick={() => handleRemoveExperience(index)}
            className="absolute right-2 top-2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                エリア
              </label>
              <AreaSelect
                value={exp.area}
                onChange={(v) => handleUpdateExperience(index, "area", v)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                業種
              </label>
              <select
                value={exp.businessType}
                onChange={(e) =>
                  handleUpdateExperience(
                    index,
                    "businessType",
                    e.target.value as BusinessType
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              >
                {BUSINESS_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                勤務期間
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="240"
                  value={exp.durationMonths ?? ""}
                  onChange={(e) =>
                    handleUpdateExperience(
                      index,
                      "durationMonths",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  placeholder="12"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
                <span className="shrink-0 text-sm text-gray-500">ヶ月</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={handleAddExperience}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm text-gray-500 transition-colors hover:border-pink-400 hover:text-pink-500"
      >
        <Plus className="h-4 w-4" />
        経験を追加
      </button>

      {experiences.length === 0 && (
        <p className="text-center text-sm text-gray-400">
          未経験の方はスキップできます
        </p>
      )}
    </div>
  );
}
