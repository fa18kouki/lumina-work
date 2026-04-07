"use client";

import { useState, useCallback } from "react";
import { Search } from "lucide-react";

interface ZipcloudResult {
  address1: string; // 都道府県
  address2: string; // 市区町村
  address3: string; // 町域
}

interface ZipcloudResponse {
  status: number;
  results: ZipcloudResult[] | null;
}

interface PostalCodeInputProps {
  onAddressFound: (address: string) => void;
  className?: string;
}

export function PostalCodeInput({ onAddressFound, className }: PostalCodeInputProps) {
  const [postalCode, setPostalCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  const formatPostalCode = (value: string): string => {
    const digits = value.replace(/[^0-9]/g, "").slice(0, 7);
    if (digits.length > 3) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    return digits;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPostalCode(e.target.value);
    setPostalCode(formatted);
    setError("");
  };

  const searchAddress = useCallback(async () => {
    const digits = postalCode.replace(/[^0-9]/g, "");
    if (digits.length !== 7) {
      setError("郵便番号は7桁で入力してください");
      return;
    }

    setIsSearching(true);
    setError("");

    try {
      const res = await fetch(
        `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${digits}`
      );
      const data: ZipcloudResponse = await res.json();

      if (data.status !== 200 || !data.results?.length) {
        setError("該当する住所が見つかりませんでした");
        return;
      }

      const result = data.results[0];
      const address = `${result.address1}${result.address2}${result.address3}`;
      onAddressFound(address);
    } catch {
      setError("住所の検索に失敗しました");
    } finally {
      setIsSearching(false);
    }
  }, [postalCode, onAddressFound]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchAddress();
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-[var(--text-main)] mb-1.5">
        郵便番号
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-sub)]">〒</span>
          <input
            type="text"
            value={postalCode}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="000-0000"
            maxLength={8}
            inputMode="numeric"
            className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
        <button
          type="button"
          onClick={searchAddress}
          disabled={isSearching}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          <Search className="w-4 h-4" />
          {isSearching ? "検索中..." : "住所検索"}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
