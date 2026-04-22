import { describe, it, expect } from "vitest";
import { resolveNextUrl } from "@/app/api/auth/callback/resolve-next-url";

describe("resolveNextUrl", () => {
  const origin = "https://lumina.app";
  const fallback = "/o/dashboard";

  it("next が null の場合は fallback を返す", () => {
    expect(resolveNextUrl(null, origin, fallback)).toBe(fallback);
  });

  it("next が空文字の場合は fallback を返す", () => {
    expect(resolveNextUrl("", origin, fallback)).toBe(fallback);
  });

  it("ルート相対パスはそのまま返す", () => {
    expect(resolveNextUrl("/o/stores/123", origin, fallback)).toBe(
      "/o/stores/123"
    );
  });

  it("ルート相対 + クエリ文字列もそのまま保持する", () => {
    expect(
      resolveNextUrl("/o/stores/123?tab=offers", origin, fallback)
    ).toBe("/o/stores/123?tab=offers");
  });

  it("同一オリジンの絶対 URL はパスのみを返す", () => {
    expect(
      resolveNextUrl(`${origin}/o/stores/123`, origin, fallback)
    ).toBe("/o/stores/123");
  });

  it("異なるオリジンの絶対 URL は fallback を返す（オープンリダイレクト対策）", () => {
    expect(resolveNextUrl("https://evil.com/phishing", origin, fallback)).toBe(
      fallback
    );
  });

  it("protocol-relative //evil.com は fallback を返す", () => {
    expect(resolveNextUrl("//evil.com/foo", origin, fallback)).toBe(fallback);
  });

  it("javascript: URL は fallback を返す", () => {
    expect(
      resolveNextUrl("javascript:alert(1)", origin, fallback)
    ).toBe(fallback);
  });

  it("不正な URL は fallback を返す", () => {
    expect(resolveNextUrl("ht!tp://broken", origin, fallback)).toBe(fallback);
  });

  it("相対パス（スラッシュ始まりでない）は fallback を返す", () => {
    expect(resolveNextUrl("stores/123", origin, fallback)).toBe(fallback);
  });
});
