"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--bg-gray)">
      <div className="text-center px-6">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-(--text-main) mb-2">
          エラーが発生しました
        </h1>
        <p className="text-(--text-sub) mb-8">
          申し訳ありません。予期しないエラーが発生しました。
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center px-6 py-3 rounded-lg bg-(--primary) text-white font-medium hover:opacity-90 transition-opacity"
        >
          もう一度試す
        </button>
      </div>
    </div>
  );
}
