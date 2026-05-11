"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";

interface CastPhotoGalleryProps {
  photos: readonly string[];
  fallbackImage: string | null;
  alt: string;
  className?: string;
}

export function CastPhotoGallery({
  photos,
  fallbackImage,
  alt,
  className = "",
}: CastPhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // photos が増減した時に index が範囲外になるのを防ぐ
  useEffect(() => {
    if (activeIndex >= photos.length) {
      setActiveIndex(0);
    }
  }, [photos.length, activeIndex]);

  const hasPhotos = photos.length > 0;
  const mainSrc = hasPhotos ? photos[activeIndex] : fallbackImage;
  const showThumbnails = photos.length > 1;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
        {mainSrc ? (
          <img
            data-testid="cast-gallery-main"
            src={mainSrc}
            alt={alt}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            data-testid="cast-gallery-placeholder"
            className="flex flex-col items-center justify-center text-gray-400"
            aria-label="写真未登録"
          >
            <User className="w-12 h-12" />
          </div>
        )}
      </div>

      {showThumbnails && (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="list"
          aria-label={`${alt}の写真一覧`}
        >
          {photos.map((src, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={`${src}-${index}`}
                type="button"
                data-testid="cast-gallery-thumb"
                aria-current={isActive}
                aria-label={`写真 ${index + 1} / ${photos.length}`}
                onClick={() => setActiveIndex(index)}
                className={`relative flex-shrink-0 w-14 h-14 rounded-md overflow-hidden transition-all ${
                  isActive
                    ? "ring-2 ring-slate-900 ring-offset-1"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
