import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  extractSupabaseImageHost,
  buildSupabaseImageRemotePatterns,
  assertSupabaseImageEnv,
} from "@/lib/supabase-image-host";

describe("BUG-4: Supabase host を next.config.ts の remotePatterns に追加するヘルパー", () => {
  describe("extractSupabaseImageHost", () => {
    it("https URL から host を抽出する", () => {
      expect(
        extractSupabaseImageHost("https://abc-xyz.supabase.co"),
      ).toBe("abc-xyz.supabase.co");
    });

    it("末尾スラッシュ付きの URL でも host を抽出できる", () => {
      expect(
        extractSupabaseImageHost("https://abc-xyz.supabase.co/"),
      ).toBe("abc-xyz.supabase.co");
    });

    it("env が未設定 (undefined / 空文字) なら null", () => {
      expect(extractSupabaseImageHost(undefined)).toBeNull();
      expect(extractSupabaseImageHost("")).toBeNull();
    });

    it("不正な URL なら null (例外を投げない)", () => {
      expect(extractSupabaseImageHost("not-a-url")).toBeNull();
    });
  });

  describe("buildSupabaseImageRemotePatterns", () => {
    it("env が無いなら空配列", () => {
      expect(buildSupabaseImageRemotePatterns(undefined)).toEqual([]);
    });

    it("Supabase URL から cast-photos / store-photos / chat-messages の 3 パターンを生成する", () => {
      const patterns = buildSupabaseImageRemotePatterns(
        "https://abc-xyz.supabase.co",
      );

      expect(patterns).toHaveLength(3);
      expect(patterns).toEqual(
        expect.arrayContaining([
          {
            protocol: "https",
            hostname: "abc-xyz.supabase.co",
            pathname: "/storage/v1/object/public/cast-photos/**",
          },
          {
            protocol: "https",
            hostname: "abc-xyz.supabase.co",
            pathname: "/storage/v1/object/public/store-photos/**",
          },
          {
            protocol: "https",
            hostname: "abc-xyz.supabase.co",
            pathname: "/storage/v1/object/public/chat-messages/**",
          },
        ]),
      );
    });

    it("ホストはハードコードせず env を読む (差分検証)", () => {
      const patterns = buildSupabaseImageRemotePatterns(
        "https://other-project.supabase.co",
      );
      for (const p of patterns) {
        expect(p.hostname).toBe("other-project.supabase.co");
      }
    });
  });

  // C-1: env が空のときに警告/エラーを出して気付かせる
  describe("assertSupabaseImageEnv", () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it("NODE_ENV=production かつ NEXT_PUBLIC_SUPABASE_URL が空 → throw", () => {
      expect(() =>
        assertSupabaseImageEnv({
          NODE_ENV: "production",
          NEXT_PUBLIC_SUPABASE_URL: "",
        } as NodeJS.ProcessEnv),
      ).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
    });

    it("NODE_ENV=production かつ NEXT_PUBLIC_SUPABASE_URL が undefined → throw", () => {
      expect(() =>
        assertSupabaseImageEnv({
          NODE_ENV: "production",
        } as NodeJS.ProcessEnv),
      ).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
    });

    it("NODE_ENV=development かつ env が空 → warn のみ (throw しない)", () => {
      expect(() =>
        assertSupabaseImageEnv({
          NODE_ENV: "development",
          NEXT_PUBLIC_SUPABASE_URL: "",
        } as NodeJS.ProcessEnv),
      ).not.toThrow();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(String(warnSpy.mock.calls[0]?.[0] ?? "")).toMatch(
        /NEXT_PUBLIC_SUPABASE_URL/,
      );
    });

    it("env が設定済 → no-op (throw も warn もしない)", () => {
      expect(() =>
        assertSupabaseImageEnv({
          NODE_ENV: "production",
          NEXT_PUBLIC_SUPABASE_URL: "https://abc-xyz.supabase.co",
        } as NodeJS.ProcessEnv),
      ).not.toThrow();
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
