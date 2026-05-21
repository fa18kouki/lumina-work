import { afterEach, describe, expect, it } from "vitest";

import { getAppUrl } from "@/lib/app-url";

const ORIGINAL = process.env.AUTH_URL;

afterEach(() => {
  if (ORIGINAL === undefined) {
    delete process.env.AUTH_URL;
  } else {
    process.env.AUTH_URL = ORIGINAL;
  }
});

describe("getAppUrl", () => {
  it("AUTH_URL 未設定時は既定値を返す", () => {
    delete process.env.AUTH_URL;
    expect(getAppUrl()).toBe("https://lumina.app");
  });

  it("末尾スラッシュを除去して返す", () => {
    process.env.AUTH_URL = "https://lumina.app/";
    expect(getAppUrl()).toBe("https://lumina.app");
  });

  it("末尾スラッシュ複数も除去", () => {
    process.env.AUTH_URL = "https://lumina.app///";
    expect(getAppUrl()).toBe("https://lumina.app");
  });

  it("末尾スラッシュ無しはそのまま", () => {
    process.env.AUTH_URL = "https://lumina.app";
    expect(getAppUrl()).toBe("https://lumina.app");
  });

  it("CTA 連結時に // が生じないこと (結合シナリオ)", () => {
    process.env.AUTH_URL = "https://lumina.app/";
    const cta = `${getAppUrl()}/s/interviews`;
    expect(cta).toBe("https://lumina.app/s/interviews");
    expect(cta).not.toContain("//s/");
  });
});
