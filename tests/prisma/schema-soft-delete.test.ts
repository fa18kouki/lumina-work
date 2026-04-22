import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";

const schemaPath = path.resolve(__dirname, "../../prisma/schema.prisma");

describe("Prisma schema - User soft delete", () => {
  it("User モデルに deletedAt DateTime? @map(\"deleted_at\") が存在する", async () => {
    const source = await readFile(schemaPath, "utf8");
    const userBlock = extractModel(source, "User");
    expect(userBlock).toBeTruthy();
    expect(userBlock).toMatch(
      /deletedAt\s+DateTime\?\s+@map\("deleted_at"\)/
    );
  });

  it("User モデルに @@index([deletedAt]) が存在する", async () => {
    const source = await readFile(schemaPath, "utf8");
    const userBlock = extractModel(source, "User");
    expect(userBlock).toBeTruthy();
    expect(userBlock).toContain("@@index([deletedAt])");
  });

  it("deletedAt 追加マイグレーションファイルが存在する", async () => {
    const { readdir } = await import("node:fs/promises");
    const migrationsDir = path.resolve(__dirname, "../../prisma/migrations");
    const entries = await readdir(migrationsDir);
    const match = entries.find((name) =>
      /user.*deleted_at|deleted_at.*user|user_soft_delete/i.test(name)
    );
    expect(match, `deletedAt migration not found in ${entries.join(", ")}`).toBeTruthy();
  });
});

function extractModel(source: string, modelName: string): string | null {
  const re = new RegExp(`model\\s+${modelName}\\s+\\{([\\s\\S]*?)\\n\\}`);
  const m = source.match(re);
  return m ? m[1] : null;
}
