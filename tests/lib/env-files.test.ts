import { describe, expect, it } from "vitest";
import { getEnvFileOrder } from "@/lib/env-files";

describe("getEnvFileOrder", () => {
  it("production では production 用ファイルを優先する", () => {
    expect(getEnvFileOrder("production")).toEqual([
      ".env.production.local",
      ".env.production",
      ".env.local",
      ".env",
    ]);
  });

  it("test では test 用ファイルを優先する", () => {
    expect(getEnvFileOrder("test")).toEqual([
      ".env.test.local",
      ".env.test",
      ".env",
    ]);
  });

  it("development では .env.develpment を最優先する", () => {
    expect(getEnvFileOrder("development")).toEqual([
      ".env.develpment.local",
      ".env.develpment",
      ".env.development.local",
      ".env.development",
      ".env.local",
      ".env",
    ]);
  });
});
