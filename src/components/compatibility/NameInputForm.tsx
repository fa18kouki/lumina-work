"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

interface NameInputFormProps {
  onSubmit: (name1: string, name2: string) => void;
}

export function NameInputForm({ onSubmit }: NameInputFormProps) {
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");

  const canSubmit = name1.trim().length > 0 && name2.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      onSubmit(name1.trim(), name2.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto rounded-full bg-(--primary-bg) flex items-center justify-center">
          <Heart className="w-8 h-8 text-(--primary)" />
        </div>
        <h1 className="text-xl font-bold text-(--text-main)">相性占い</h1>
        <p className="text-sm text-(--text-sub)">
          お互いの名前を入力して相性をチェック！
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="name1"
            className="block text-sm font-medium text-(--text-main) mb-1"
          >
            あなたの名前
          </label>
          <input
            id="name1"
            type="text"
            value={name1}
            onChange={(e) => setName1(e.target.value)}
            placeholder="名前を入力"
            maxLength={20}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-(--text-main) placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent transition-shadow"
          />
        </div>

        <div className="flex justify-center">
          <span className="text-2xl">×</span>
        </div>

        <div>
          <label
            htmlFor="name2"
            className="block text-sm font-medium text-(--text-main) mb-1"
          >
            お相手の名前
          </label>
          <input
            id="name2"
            type="text"
            value={name2}
            onChange={(e) => setName2(e.target.value)}
            placeholder="名前を入力"
            maxLength={20}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-(--text-main) placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent transition-shadow"
          />
        </div>
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
