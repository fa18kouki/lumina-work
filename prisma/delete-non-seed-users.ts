import dotenv from "dotenv";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { getEnvFileOrder } from "../src/lib/env-files";

dotenv.config({ path: getEnvFileOrder(process.env.NODE_ENV) });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SEED_EMAIL_PREFIX = "seed-";
const SEED_EMAIL_SUFFIX = "@example.com";

function isSeedUser(email: string | null): boolean {
  if (!email) return false;
  return (
    email.startsWith(SEED_EMAIL_PREFIX) && email.endsWith(SEED_EMAIL_SUFFIX)
  );
}

function getDbHost(): string {
  const raw = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
  try {
    return new URL(raw).host || "(unknown)";
  } catch {
    return "(parse-error)";
  }
}

async function main() {
  const execute = process.argv.includes("--execute");

  console.log(`🔗 DB host: ${getDbHost()}`);
  console.log(
    execute
      ? "💥 EXECUTE モード: 実際に削除します"
      : "👀 DRY-RUN モード: 削除しません (--execute で実削除)",
  );

  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      supabaseAuthId: true,
      createdAt: true,
    },
  });

  const nonSeed = allUsers.filter((u) => !isSeedUser(u.email));
  const seed = allUsers.filter((u) => isSeedUser(u.email));

  const countByRole = (list: typeof allUsers) => ({
    CAST: list.filter((u) => u.role === "CAST").length,
    OWNER: list.filter((u) => u.role === "OWNER").length,
    ADMIN: list.filter((u) => u.role === "ADMIN").length,
  });

  console.log(`\n📊 集計`);
  console.log(`   全ユーザー: ${allUsers.length} 件`);
  console.log(
    `   シード (保持): ${seed.length} 件`,
    countByRole(seed),
  );
  console.log(
    `   非シード (削除対象): ${nonSeed.length} 件`,
    countByRole(nonSeed),
  );

  if (nonSeed.length === 0) {
    console.log("\n✅ 削除対象なし。終了します。");
    return;
  }

  console.log(`\n📄 削除対象サンプル (最大10件):`);
  for (const u of nonSeed.slice(0, 10)) {
    const supabaseFlag = u.supabaseAuthId ? " [supabase連携あり]" : "";
    console.log(
      `   - [${u.role}] ${u.email ?? "(email=null)"}${supabaseFlag}`,
    );
  }
  if (nonSeed.length > 10) {
    console.log(`   ... ほか ${nonSeed.length - 10} 件`);
  }

  if (!execute) {
    console.log(
      `\n⏭  dry-run なのでここで終了。実削除するには: bun run prisma/delete-non-seed-users.ts --execute`,
    );
    return;
  }

  const ids = nonSeed.map((u) => u.id);
  const result = await prisma.user.deleteMany({
    where: { id: { in: ids } },
  });

  console.log(
    `\n🗑️  削除完了: ${result.count} 件 (Cast/Owner/Store/Match/Offer/Account/Session 等は cascade で連鎖削除済み)`,
  );

  if (nonSeed.some((u) => u.supabaseAuthId)) {
    console.log(
      `\n⚠️  Supabase auth.users 側には supabaseAuthId 紐付きレコードが残っています。必要なら Supabase Studio から別途削除してください。`,
    );
  }
}

main()
  .catch((e) => {
    console.error("❌ 実行エラー:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
