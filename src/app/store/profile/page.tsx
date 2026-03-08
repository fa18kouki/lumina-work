"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc";
import { AreaSelect } from "@/components/ui/area-select";
import { SalaryInput, type SalaryData } from "@/components/store/salary-input";
import { StorePhotoUploader } from "@/components/store/store-photo-uploader";

const BENEFITS = [
  "日払いOK",
  "週払いOK",
  "送り迎えあり",
  "ヘアメイク完備",
  "衣装貸出あり",
  "ノルマなし",
  "罰金なし",
  "終電上がりOK",
  "週1日からOK",
  "短期OK",
  "体験入店歓迎",
  "未経験歓迎",
  "経験者優遇",
  "友達紹介制度",
  "寮完備",
  "託児所補助",
];

export default function StoreProfilePage() {
  const { data: profile, isLoading } = trpc.store.getProfile.useQuery();
  const utils = trpc.useUtils();

  const defaultSalary: SalaryData = {
    hourlyRateMin: 0,
    hourlyRateMax: 0,
  };

  const [formData, setFormData] = useState({
    name: "",
    area: "",
    address: "",
    description: "",
    businessHours: "",
    salarySystem: defaultSalary,
    benefits: [] as string[],
    photos: [] as string[],
  });

  const upsertProfile = trpc.store.upsertProfile.useMutation({
    onSuccess: () => {
      utils.store.getProfile.invalidate();
      alert("プロフィールを保存しました");
    },
    onError: (error) => {
      alert(`エラーが発生しました: ${error.message}`);
    },
  });

  useEffect(() => {
    if (profile) {
      const salary = profile.salarySystem as SalaryData | null;
      setFormData({
        name: profile.name ?? "",
        area: profile.area ?? "",
        address: profile.address ?? "",
        description: profile.description ?? "",
        businessHours: profile.businessHours ?? "",
        salarySystem: salary ?? defaultSalary,
        benefits: profile.benefits ?? [],
        photos: profile.photos ?? [],
      });
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { salarySystem, ...rest } = formData;
    const hasSalary = salarySystem.hourlyRateMin > 0 && salarySystem.hourlyRateMax > 0;
    // undefinedのフィールドを除去してクリーンなJSONにする
    const cleanSalary = hasSalary
      ? Object.fromEntries(
          Object.entries(salarySystem).filter(([, v]) => v !== undefined && v !== 0 || false)
        ) as SalaryData
      : undefined;
    // hourlyRateMin/Maxは0でも必須なので再セット
    if (cleanSalary && hasSalary) {
      cleanSalary.hourlyRateMin = salarySystem.hourlyRateMin;
      cleanSalary.hourlyRateMax = salarySystem.hourlyRateMax;
    }
    upsertProfile.mutate({ ...rest, salarySystem: cleanSalary, photos: formData.photos });
  };

  const toggleBenefit = (benefit: string) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.includes(benefit)
        ? prev.benefits.filter((b) => b !== benefit)
        : [...prev.benefits, benefit],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-(--text-main)">店舗情報</h1>
        <p className="text-(--text-sub) mt-1">
          店舗の基本情報と求人条件を設定します
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-(--text-main) mb-4">基本情報</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-(--text-main) mb-1">
                店舗名 <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例: クラブ エレガンス"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-(--text-main) mb-1">
                エリア <span className="text-red-500">*</span>
              </label>
              <AreaSelect
                value={formData.area}
                onChange={(v) => setFormData({ ...formData, area: v })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-(--text-main) mb-1">
                住所 <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="例: 東京都新宿区歌舞伎町1-1-1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-(--text-main) mb-1">
                営業時間
              </label>
              <Input
                type="text"
                value={formData.businessHours}
                onChange={(e) => setFormData({ ...formData, businessHours: e.target.value })}
                placeholder="例: 20:00〜LAST"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-(--text-main) mb-1">
                店舗紹介
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="店舗の特徴やアピールポイントを入力してください"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none"
              />
            </div>
          </div>
        </Card>

        {/* 店舗写真 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-(--text-main) mb-4">店舗写真</h2>
          <StorePhotoUploader
            photos={formData.photos}
            onPhotosChange={(photos) => setFormData({ ...formData, photos })}
          />
        </Card>

        {/* 給与体系 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-(--text-main) mb-4">給与体系</h2>
          <SalaryInput
            value={formData.salarySystem}
            onChange={(salary) => setFormData({ ...formData, salarySystem: salary })}
          />
        </Card>

        {/* 待遇・福利厚生 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-(--text-main) mb-4">待遇・福利厚生</h2>
          <div className="flex flex-wrap gap-2">
            {BENEFITS.map((benefit) => (
              <button
                key={benefit}
                type="button"
                onClick={() => toggleBenefit(benefit)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  formData.benefits.includes(benefit)
                    ? "bg-slate-800 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {benefit}
              </button>
            ))}
          </div>
          <p className="text-sm text-(--text-sub) mt-3">
            該当する待遇をタップして選択してください
          </p>
        </Card>

        {/* 保存ボタン */}
        <div className="flex justify-end gap-4">
          <Button
            type="submit"
            isLoading={upsertProfile.isPending}
            className="px-8"
          >
            保存する
          </Button>
        </div>
      </form>
    </div>
  );
}
