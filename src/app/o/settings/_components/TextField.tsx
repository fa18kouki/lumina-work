"use client";

import { useId } from "react";

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "password";
  hint?: string;
  optional?: boolean;
  maxLength?: number;
  disabled?: boolean;
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  hint,
  optional,
  maxLength,
  disabled,
}: TextFieldProps) {
  const id = useId();

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-[var(--text-main)] mb-2"
      >
        {label}
        {optional && (
          <span className="text-xs text-[var(--text-sub)] ml-2">(任意)</span>
        )}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 disabled:bg-gray-50 disabled:text-gray-500"
      />
      {hint && (
        <p className="mt-1.5 text-xs text-[var(--text-sub)]">{hint}</p>
      )}
    </div>
  );
}
