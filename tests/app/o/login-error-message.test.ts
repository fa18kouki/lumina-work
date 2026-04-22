import { describe, it, expect } from "vitest";
import { ownerLoginErrorMessage } from "@/app/o/login/error-message";

describe("ownerLoginErrorMessage", () => {
  it("null なら空文字を返す", () => {
    expect(ownerLoginErrorMessage(null)).toBe("");
  });

  it("auth_failed は汎用メッセージ", () => {
    expect(ownerLoginErrorMessage("auth_failed")).toContain("認証に失敗");
  });

  it("not_owner は親切なメッセージ（オーナー権限 + 問い合わせ導線）", () => {
    const msg = ownerLoginErrorMessage("not_owner");
    expect(msg).toContain("オーナー");
    expect(msg).not.toBe("not_owner");
  });

  it("missing_code は汎用メッセージ", () => {
    const msg = ownerLoginErrorMessage("missing_code");
    expect(msg.length).toBeGreaterThan(0);
    expect(msg).not.toBe("missing_code");
  });

  it("未知のエラーコードは空文字を返す（URL エラー文字列を露出しない）", () => {
    expect(ownerLoginErrorMessage("weird_value")).toBe("");
  });
});
