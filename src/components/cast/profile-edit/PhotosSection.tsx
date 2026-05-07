"use client";

import { PhotoUploader } from "@/components/cast/PhotoUploader";

interface Props {
  data: {
    photos: string[];
  };
  onChange: (field: string, value: unknown) => void;
}

export function PhotosSection({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-(--text-main) mb-1">
          プロフィール写真
        </h2>
        <p className="text-xs text-(--text-sub)">
          オーナーが見るリストや詳細に表示されます。診断時の写真も差し替えできます。
        </p>
      </div>
      <PhotoUploader
        photos={data.photos}
        onPhotosChange={(photos) => onChange("photos", photos)}
      />
    </div>
  );
}
