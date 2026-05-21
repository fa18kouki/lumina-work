import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getEmailFrom } from "@/lib/resend";

const ORIGINAL = process.env.EMAIL_FROM;

beforeEach(() => {
  delete process.env.EMAIL_FROM;
});

afterEach(() => {
  if (ORIGINAL === undefined) {
    delete process.env.EMAIL_FROM;
  } else {
    process.env.EMAIL_FROM = ORIGINAL;
  }
});

describe("getEmailFrom", () => {
  it("EMAIL_FROM 未設定なら明示的に throw する (fallback で本番ドメインを送らない)", () => {
    expect(() => getEmailFrom()).toThrow(/EMAIL_FROM is not configured/);
  });

  it("EMAIL_FROM が設定されていれば値をそのまま返す", () => {
    process.env.EMAIL_FROM = "LUMINA <noreply@lumina.app>";
    expect(getEmailFrom()).toBe("LUMINA <noreply@lumina.app>");
  });

  it("空文字は未設定と同等に扱い throw する", () => {
    process.env.EMAIL_FROM = "";
    expect(() => getEmailFrom()).toThrow(/EMAIL_FROM is not configured/);
  });
});
