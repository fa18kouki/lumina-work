"use client";

import { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  danger?: boolean;
}

export function SectionCard({
  title,
  description,
  children,
  danger,
}: SectionCardProps) {
  return (
    <div
      className={`rounded-xl p-6 border ${
        danger
          ? "bg-red-50/30 border-red-200"
          : "bg-white border-gray-100"
      }`}
    >
      <h2
        className={`text-base font-bold mb-1 ${
          danger ? "text-red-700" : "text-[var(--text-main)]"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`text-xs mb-5 ${
            danger ? "text-red-600/80" : "text-[var(--text-sub)]"
          }`}
        >
          {description}
        </p>
      )}
      {!description && <div className="mb-4" />}
      {children}
    </div>
  );
}
