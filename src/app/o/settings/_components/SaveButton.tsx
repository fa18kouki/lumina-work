"use client";

interface SaveButtonProps {
  isPending: boolean;
  isSuccess?: boolean;
  errorMessage?: string;
  onClick: () => void;
  label?: string;
}

export function SaveButton({
  isPending,
  isSuccess,
  errorMessage,
  onClick,
  label = "保存",
}: SaveButtonProps) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <button
        onClick={onClick}
        disabled={isPending}
        className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
      >
        {isPending ? "保存中..." : label}
      </button>
      {isSuccess && (
        <span className="text-sm text-emerald-600">保存しました</span>
      )}
      {errorMessage && (
        <span className="text-sm text-red-600">{errorMessage}</span>
      )}
    </div>
  );
}
