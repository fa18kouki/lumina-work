import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("単一クラスをそのまま返す", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("複数クラスをスペースで結合する", () => {
    expect(cn("foo", "bar", "baz")).toBe("foo bar baz");
  });

  it("undefinedを除外する", () => {
    expect(cn("foo", undefined, "bar")).toBe("foo bar");
  });

  it("nullを除外する", () => {
    expect(cn("foo", null, "bar")).toBe("foo bar");
  });

  it("falseを除外する", () => {
    expect(cn("foo", false, "bar")).toBe("foo bar");
  });

  it("空文字列を除外する", () => {
    expect(cn("foo", "", "bar")).toBe("foo bar");
  });

  it("条件付きクラスをサポートする", () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn("btn", isActive && "btn-active", isDisabled && "btn-disabled")).toBe(
      "btn btn-active"
    );
  });

  it("引数なしで空文字列を返す", () => {
    expect(cn()).toBe("");
  });

  it("すべてfalsyな場合に空文字列を返す", () => {
    expect(cn(undefined, null, false)).toBe("");
  });
});
