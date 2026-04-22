import { describe, it, expect } from "vitest";
import { readFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../../../..");

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

describe("RUN-248 M: ProfileWizard 完全削除", () => {
  it("/c/profile/page.tsx は ProfileWizard を import しない", async () => {
    const source = await readFile(
      path.join(repoRoot, "src/app/c/(app)/profile/page.tsx"),
      "utf-8"
    );

    expect(source).not.toMatch(/ProfileWizard/);
  });

  it("src/components/cast/ProfileWizard.tsx は存在しない", async () => {
    const wizardPath = path.join(repoRoot, "src/components/cast/ProfileWizard.tsx");

    expect(await exists(wizardPath)).toBe(false);
  });

  it("src/components/cast/steps ディレクトリは存在しない", async () => {
    const stepsDir = path.join(repoRoot, "src/components/cast/steps");

    expect(await exists(stepsDir)).toBe(false);
  });

  it("リポジトリ内のいずれのソースからも ProfileWizard は参照されない", async () => {
    const { execSync } = await import("node:child_process");
    const result = execSync(
      "git grep -l 'ProfileWizard' -- 'src/' 'tests/' || true",
      { cwd: repoRoot, encoding: "utf-8" }
    )
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      // このテスト自身は "ProfileWizard" という文字列を含むので除外する
      .filter((line) => !line.endsWith("no-profile-wizard.test.ts"));

    expect(result).toEqual([]);
  });
});
