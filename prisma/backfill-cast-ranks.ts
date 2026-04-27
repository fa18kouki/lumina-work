import dotenv from "dotenv";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { getEnvFileOrder } from "../src/lib/env-files";
import { calculateRank } from "../src/lib/diagnosis/calculate-rank";
import { assertNotProductionDb } from "./_safety";

dotenv.config({ path: getEnvFileOrder(process.env.NODE_ENV) });

assertNotProductionDb("backfill-cast-ranks");

const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 既存キャストの rank をバックフィルします...");

  const casts = await prisma.cast.findMany({
    where: { diagnosisCompleted: true },
    include: { diagnosisSession: true },
  });

  console.log(`   対象キャスト: ${casts.length} 件`);

  let updated = 0;
  let skipped = 0;
  let unchanged = 0;

  for (const cast of casts) {
    const answers = (cast.diagnosisSession?.answers ?? null) as Record<
      string,
      unknown
    > | null;

    if (!answers || typeof answers !== "object") {
      skipped++;
      console.warn(`  ⚠️  [skip] ${cast.id}: answers がありません`);
      continue;
    }

    const totalExperienceYears =
      typeof answers.totalExperienceYears === "number"
        ? answers.totalExperienceYears
        : undefined;
    const desiredAreas = Array.isArray(answers.desiredAreas)
      ? (answers.desiredAreas as string[])
      : undefined;
    const previousHourlyRate =
      typeof answers.previousHourlyRate === "number"
        ? answers.previousHourlyRate
        : undefined;

    const newRank = calculateRank({
      totalExperienceYears,
      desiredAreas,
      previousHourlyRate,
    });

    if (cast.rank === newRank) {
      unchanged++;
      continue;
    }

    await prisma.cast.update({
      where: { id: cast.id },
      data: { rank: newRank },
    });

    updated++;
    console.log(
      `  ✅ [update] ${cast.nickname ?? cast.id}: ${cast.rank} → ${newRank}`
    );
  }

  console.log(
    `\n🎉 完了: 更新 ${updated} 件, 変更なし ${unchanged} 件, スキップ ${skipped} 件`
  );
}

main()
  .catch((e) => {
    console.error("バックフィル実行エラー:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
