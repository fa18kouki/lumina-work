import { existsSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { lpLuminaAssetPaths } from "@/lib/lp-assets";

const repoRoot = path.resolve(__dirname, "../..");

describe("lpLuminaAssetPaths", () => {
  it.each(lpLuminaAssetPaths)("public 配下にファイルがある: %s", (publicPath) => {
    const abs = path.join(repoRoot, "public", publicPath.replace(/^\//, ""));
    expect(existsSync(abs)).toBe(true);
  });
});
