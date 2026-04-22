import { describe, it, expect } from "vitest";
import { emergencyContactSchema } from "@/lib/cast/emergency-contact";

describe("emergencyContactSchema", () => {
  it("relation と name のみで受け付ける", () => {
    const result = emergencyContactSchema.safeParse({
      relation: "母",
      name: "山田花子",
    });
    expect(result.success).toBe(true);
  });

  it("address と phone を追加できる", () => {
    const result = emergencyContactSchema.safeParse({
      relation: "母",
      name: "山田花子",
      address: "東京都新宿区1-2-3",
      phone: "090-1234-5678",
    });
    expect(result.success).toBe(true);
  });

  it("phone のハイフンなし 10 桁を許容する", () => {
    const result = emergencyContactSchema.safeParse({
      relation: "父",
      name: "山田太郎",
      phone: "0312345678",
    });
    expect(result.success).toBe(true);
  });

  it("phone の + 記号付き国際番号を許容する", () => {
    const result = emergencyContactSchema.safeParse({
      relation: "兄",
      name: "山田一郎",
      phone: "+81-90-1234-5678",
    });
    expect(result.success).toBe(true);
  });

  it("phone が 9 桁未満(数字のみ)の場合は拒否する", () => {
    const result = emergencyContactSchema.safeParse({
      relation: "母",
      name: "山田花子",
      phone: "123456789",
    });
    expect(result.success).toBe(false);
  });

  it("phone が 16 桁以上(数字のみ)の場合は拒否する", () => {
    const result = emergencyContactSchema.safeParse({
      relation: "母",
      name: "山田花子",
      phone: "12345678901234567",
    });
    expect(result.success).toBe(false);
  });

  it("phone に英字が混入している場合は拒否する", () => {
    const result = emergencyContactSchema.safeParse({
      relation: "母",
      name: "山田花子",
      phone: "090-abcd-1234",
    });
    expect(result.success).toBe(false);
  });

  it("phone が空文字の場合は受け付ける (未入力扱い)", () => {
    const result = emergencyContactSchema.safeParse({
      relation: "母",
      name: "山田花子",
      phone: "",
    });
    expect(result.success).toBe(true);
  });

  it("relation と name も空欄を許容する（段階入力のため optional）", () => {
    const result = emergencyContactSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
