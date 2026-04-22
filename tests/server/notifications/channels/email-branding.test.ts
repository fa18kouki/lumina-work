import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";

describe("Email channel branding - regression", () => {
  it("src/server/notifications/channels/email.ts に「マッチング」を含まない", async () => {
    const file = path.resolve(
      __dirname,
      "../../../../src/server/notifications/channels/email.ts"
    );
    const source = await readFile(file, "utf8");
    expect(source).not.toContain("マッチング");
  });

  it("src/lib/auth-email-template.ts に「マッチング」を含まない", async () => {
    const file = path.resolve(
      __dirname,
      "../../../../src/lib/auth-email-template.ts"
    );
    const source = await readFile(file, "utf8");
    expect(source).not.toContain("マッチング");
  });
});
