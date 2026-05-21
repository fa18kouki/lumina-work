import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";

describe("Email channel branding - regression", () => {
  it("src/server/notifications/channels/email.tsx に「マッチング」を含まない", async () => {
    const file = path.resolve(
      __dirname,
      "../../../../src/server/notifications/channels/email.tsx"
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

  it("src/emails/ 配下のテンプレ群に「マッチング」を含まない", async () => {
    const dir = path.resolve(__dirname, "../../../../src/emails");
    const files = [
      "_layout.tsx",
      "magic-link.tsx",
      "offer-received.tsx",
      "offer-accepted.tsx",
      "offer-rejected.tsx",
      "offer-expired.tsx",
      "interview-scheduled-cast.tsx",
      "interview-scheduled-store.tsx",
      "interview-cancelled-cast.tsx",
      "interview-cancelled-store.tsx",
      "message-received.tsx",
      "no-show-reported.tsx",
      "account-suspended.tsx",
    ];
    for (const f of files) {
      const source = await readFile(path.join(dir, f), "utf8");
      expect(source, `${f} に「マッチング」が含まれている`).not.toContain(
        "マッチング",
      );
    }
  });
});
