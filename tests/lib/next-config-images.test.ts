import { describe, it, expect } from "vitest";
import {
  extractSupabaseImageHost,
  buildSupabaseImageRemotePatterns,
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
});
