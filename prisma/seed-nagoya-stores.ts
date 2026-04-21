import dotenv from "dotenv";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { getEnvFileOrder } from "../src/lib/env-files";
import { getAreaAddressPrefix } from "../src/lib/areas";

dotenv.config({ path: getEnvFileOrder(process.env.NODE_ENV) });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// エリアごとの店舗データ
interface StoreEntry {
  email: string;
  store: {
    name: string;
    area: string;
    address: string;
    isVerified: boolean;
  };
}

function makeEmail(name: string, area: string): string {
  // 日本語とスペースを除去し、英数字のみでemail生成
  const sanitized = name
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
  const areaTag = area.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "nagoya";
  return `seed-nagoya-${areaTag}-${sanitized || Math.random().toString(36).slice(2, 8)}@example.com`;
}

function buildStores(area: string, names: string[]): StoreEntry[] {
  return names.map((name) => ({
    email: makeEmail(name, area),
    store: {
      name,
      area,
      address: getAreaAddressPrefix(area),
      isVerified: true,
    },
  }));
}

// ─── 名駅 ───
const meiekiStores = buildStores("名駅", [
  "Public Space TAIGA",
  "C-club 名古屋駅前店",
  "ZERO 名古屋駅店",
  "Seviann",
  "CLUB Blue Moon",
  "CLUB DOLL'S",
  "Ann",
  "Lamp",
  "R",
  "PRO portion",
  "mrs.J 名駅東",
  "mrs.J 名駅西",
  "美酒乱 離宮",
]);

// ─── 錦 ───
const nishikiStores = buildStores("錦", [
  "NEW CLUB PiNK",
  "Avalon",
  "CLUB AMATERAS",
  "club Lalah 錦",
  "CLUB ATHENA",
  "CLUB VENUS",
  "CLUB DIANA",
  "CLUB ZEUZ",
  "CLUB R",
  "club amon",
  "CLUB CHLOE",
  "CLUB GLAMOROUS",
  "CLUB EXCELLENT",
  "CLUB EMPIRE",
  "CLUB PREMIERE",
  "CLUB NOBLE",
  "CLUB LEGEND",
  "CLUB ROYAL",
  "CLUB PARADISE",
  "CLUB LUXURY",
  "CLUB GORGEOUS",
  "CLUB ELEGANCE",
  "CLUB BRILLIANT",
  "CLUB DAZZLE",
  "CLUB SPARKLE",
  "CLUB TWINKLE",
  "Mrs.CAFE～離宮～",
  "オーシャンズ",
  "mrs.J 錦",
  "CLUB GLOW",
  "CLUB KAGERO",
  "CLUB GEMME 錦",
  "THE MAJESTY",
  "TRANCE",
  "Verxina",
  "Club Defi",
  "L+",
  "STORY",
  "CLUB COOL",
  "Audrey's Cast",
  "CLUB WARP",
  "Second",
  "CLUB LINEAR",
  "CLUB BEZEL",
  "La Donna",
  "La Luce",
  "Centurion",
  "MAVERICK",
  "The One",
  "LANCER",
  "EPISODE",
  "WHITE STAGE",
  "LUVES",
  "CLUB 涼水",
  "Art's cafe",
  "くらぶ 木蘭",
  "Senten's",
  "くらぶ色錦",
  "Casqued'or",
  "Lounge BLENDA",
  "ZOO NAGOYA",
  "CLUB Labyrinth",
  "Veloce",
  "CLUB Ciel",
  "THE TERRACE",
  "ORCHID",
  "REVE",
  "CLUB ROUGE",
  "Baccarat",
  "Aile",
  "Luminous",
  "VILLA",
  "CHOUCHOU",
  "FELICE",
  "EVE",
  "AQUA",
  "MUSE",
  "JILL",
  "Aura",
  "Lien",
  "Etoile",
  "Rien",
  "Stella",
  "Iris",
  "CLUB V",
  "CLUB D",
  "CLUB F",
  "CLUB T",
  "mrs.J 錦 別館",
  "オーシャンズ 錦店",
  "錦華",
  "RUNWAY",
  "クラブハナン・錦三店",
  "メンバーズ花心",
  "Mrs. CAFE 光",
  "熟女クラブ しらゆり",
  "RAMOON",
  "ニシキ近未来空間",
  "ミニスカ女学園ViVi",
  "ALRAI",
  "Salon",
]);

// ─── 栄（金山含む） ───
const sakaeStores = buildStores("栄", [
  "amour",
  "Z CAFE",
]);

const kanayamaStores = buildStores("金山", [
  "楽GAKU 金山本店",
  "mrs.J 金山",
  "CLUB LUNA 金山",
  "CLUB VENUS 金山",
  "CLUB ROUGE 金山",
  "CLUB EXCELLENT 金山",
  "CLUB AMBER 金山",
  "CLUB GARNET 金山",
  "CLUB PEARL 金山",
  "CLUB OPAL 金山",
  "CLUB JADE 金山",
  "CLUB QUARTZ 金山",
  "セカンドルーム 金山",
  "クラブ アリーナ 金山",
  "クラブ リオン 金山",
  "クラブ アネックス 金山",
  "クラブ ベル 金山",
  "熟女キャバクラ 華音",
]);

// ─── 栄・女子大 ───
const sakaeJoshidaiStores = buildStores("栄・女子大", [
  "CLUB NAGOYA",
  "CLUB AMUSE",
  "club R 栄",
  "CLUB PENTHOUSE",
  "New Club 華",
  "CLUB ELEGANCE 栄",
  "CLUB VENUS 栄",
  "CLUB DIANA 栄",
  "熟女キャバクラ 艶 栄店",
]);

// ─── 今池 ───
const imaikeStores = buildStores("今池", [
  "CLUB REINE 今池",
  "CLUB LUNA 今池",
  "CLUB VENUS 今池",
  "CLUB AMBER 今池",
  "CLUB GARNET 今池",
  "CLUB PEARL 今池",
  "CLUB OPAL 今池",
  "CLUB JADE 今池",
  "CLUB QUARTZ 今池",
  "CLUB ONYX 今池",
  "クラブ サクセス 今池",
  "クラブ リバティ 今池",
  "クラブ アリーナ 今池",
  "クラブ ベル 今池",
  "熟女キャバクラ 華音 今池",
  "熟女キャバクラ 艶 今池",
]);

// ─── 一宮 ───
const ichinomiyaStores = buildStores("一宮", [
  "DAHLIA",
  "IMPERIAL CLUB Belle",
  "BLISS",
  "club REX",
  "ぱぶ Pinky2",
  "mrs.J 一宮",
  "熟女キャバクラ LADY GARDEN",
  "PZ Lounge",
]);

// ─── 春日井 ───
const kasugaiStores = buildStores("春日井", [
  "club Ciel 春日井",
  "CLUB GLAMOROUS 春日井",
  "Lounge 華月",
  "Lounge 雅",
  "club G",
  "CLUB ROUGE 春日井",
  "熟女キャバクラ mrs.J 春日井",
  "熟女パブ 艶 春日井店",
]);

// ─── 豊田 ───
const toyotaStores = buildStores("豊田", [
  "CLUB Diana",
  "ガーデン",
  "CLUB Granja",
  "club UUR",
  "Rheia",
  "CLUB GRAN AXE",
  "HERMOSA",
  "GRAND GARDEN",
  "CLUB 翡翠",
  "熟女キャバクラ mrs.J 豊田",
  "Lounge 月華",
  "lounge garden",
]);

// ─── 岡崎 ───
const okazakiStores = buildStores("岡崎", [
  "CLUB VENUS",
  "CLUB AMETHYST",
  "Lounge 琥珀",
  "CLUB DIANA 岡崎",
  "mrs.J 岡崎",
]);

// ─── 刈谷 ───
const kariyaStores = buildStores("刈谷", [
  "CLUB ROUGE 刈谷",
  "CLUB LUNA 刈谷",
  "CLUB GARNET",
  "熟女キャバクラ 艶 刈谷店",
  "Lounge 雅",
]);

// ─── 安城 ───
const anjoStores = buildStores("安城", [
  "CLUB NOBLE 安城",
  "CLUB GRACE 安城",
  "CLUB JADE 安城",
  "熟女キャバクラ 華音 安城",
]);

// ─── 藤が丘 ───
const fujigaokaStores = buildStores("藤が丘", [
  "club CHLOE 藤が丘",
  "CLUB VENUS 藤が丘",
  "CLUB AMETHYST 藤が丘",
  "CLUB EMERALD 藤が丘",
  "CLUB SAPPHIRE 藤が丘",
  "mrs.J 藤が丘",
  "熟女キャバクラ 艶 藤が丘店",
  "Lounge 華音 藤が丘",
]);

// ─── 大曽根 ───
const ozoneStores = buildStores("大曽根", [
  "with",
  "CLUB VENUS 大曽根",
  "CLUB GRACE 大曽根",
  "CLUB LUNA 大曽根",
  "熟女キャバクラ 艶 大曽根店",
  "mrs.J 大曽根",
]);

// ─── 豊橋 ───
const toyohashiStores = buildStores("豊橋", [
  "CLUB NOBLE 豊橋",
  "CLUB JADE 豊橋",
  "CLUB ROUGE 豊橋",
  "CLUB GARNET 豊橋",
  "Lounge 華音 豊橋",
  "熟女キャバクラ mrs.J 豊橋",
]);

// ─── 知多・半田 ───
const chitaHandaStores = buildStores("知多・半田", [
  "CLUB AMETHYST 半田",
  "CLUB PEARL 東海",
  "Lounge 雅 半田",
  "熟女キャバクラ 華音 半田",
]);

// ─── 柴田・星崎 ───
const shibataHoshizakiStores = buildStores("柴田・星崎", [
  "CLUB OPAL 柴田",
  "CLUB ROUGE 星崎",
  "CLUB VENUS 柴田",
  "熟女パブ 艶 柴田店",
]);

// 全店舗を結合
const allStores: StoreEntry[] = [
  ...meiekiStores,
  ...nishikiStores,
  ...sakaeStores,
  ...kanayamaStores,
  ...sakaeJoshidaiStores,
  ...imaikeStores,
  ...ichinomiyaStores,
  ...kasugaiStores,
  ...toyotaStores,
  ...okazakiStores,
  ...kariyaStores,
  ...anjoStores,
  ...fujigaokaStores,
  ...ozoneStores,
  ...toyohashiStores,
  ...chitaHandaStores,
  ...shibataHoshizakiStores,
];

async function main() {
  console.log("🌱 名古屋エリア店舗シードデータの投入を開始します...");
  console.log(`   合計 ${allStores.length} 店舗を登録します\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const s of allStores) {
    try {
      const user = await prisma.user.upsert({
        where: { email: s.email },
        update: {},
        create: {
          email: s.email,
          role: "OWNER",
          emailVerified: new Date(),
        },
      });

      // 店舗名ベースで簡易的な法人名・代表者名を生成
      // （名古屋シードは件数が多いため最低限の companyName のみ埋める）
      const companyName = `株式会社${s.store.name.replace(/\s+/g, "")}`;
      const owner = await prisma.owner.upsert({
        where: { userId: user.id },
        update: { companyName },
        create: { userId: user.id, companyName, isVerified: true },
      });

      await prisma.store.upsert({
        where: { id: `seed-${s.email}` },
        update: s.store,
        create: {
          id: `seed-${s.email}`,
          ownerId: owner.id,
          ...s.store,
        },
      });

      successCount++;
      console.log(`  ✅ [${s.store.area}] ${s.store.name}`);
    } catch (error) {
      errorCount++;
      console.error(`  ❌ [${s.store.area}] ${s.store.name}:`, error);
    }
  }

  // ==================== 多店舗オーナー（1オーナー:N店舗のデモ）====================
  // 名古屋エリアで1法人が複数店舗（5店舗）を保有するケース。
  // 管理画面で「店舗切替」「maxStores 制約」などを検証するためのデモデータ。
  try {
    const chainOwnerEmail = "seed-owner-multi-nagoya@example.com";
    const chainOwnerUser = await prisma.user.upsert({
      where: { email: chainOwnerEmail },
      update: {},
      create: {
        email: chainOwnerEmail,
        role: "OWNER",
        emailVerified: new Date(),
      },
    });

    const chainOwner = await prisma.owner.upsert({
      where: { userId: chainOwnerUser.id },
      update: {
        companyName: "株式会社名古屋ナイトワークス",
        representativeName: "愛知 健三",
        representativeFurigana: "あいち けんぞう",
        representativePhone: "052-300-0001",
        corporateNumber: "2000002000002",
        invoiceRegistrationNumber: "T2000002000002",
        headOfficeAddress: "愛知県名古屋市中村区名駅3-1-1 本社ビル12F",
        billingContactName: "経理部 本社担当",
        billingContactEmail: "keiri-hq@nagoya-nightworks.example.com",
        isVerified: true,
      },
      create: {
        userId: chainOwnerUser.id,
        companyName: "株式会社名古屋ナイトワークス",
        representativeName: "愛知 健三",
        representativeFurigana: "あいち けんぞう",
        representativePhone: "052-300-0001",
        corporateNumber: "2000002000002",
        invoiceRegistrationNumber: "T2000002000002",
        headOfficeAddress: "愛知県名古屋市中村区名駅3-1-1 本社ビル12F",
        billingContactName: "経理部 本社担当",
        billingContactEmail: "keiri-hq@nagoya-nightworks.example.com",
        isVerified: true,
      },
    });

    const chainStores = [
      { id: "seed-chain-nagoya-meieki", name: "Premium Chain 名駅", area: "名駅" },
      { id: "seed-chain-nagoya-nishiki", name: "Premium Chain 錦", area: "錦" },
      { id: "seed-chain-nagoya-sakae", name: "Premium Chain 栄", area: "栄" },
      { id: "seed-chain-nagoya-kanayama", name: "Premium Chain 金山", area: "金山" },
      { id: "seed-chain-nagoya-imaike", name: "Premium Chain 今池", area: "今池" },
    ];

    for (const st of chainStores) {
      await prisma.store.upsert({
        where: { id: st.id },
        update: {
          name: st.name,
          area: st.area,
          address: getAreaAddressPrefix(st.area),
          isVerified: true,
        },
        create: {
          id: st.id,
          ownerId: chainOwner.id,
          name: st.name,
          area: st.area,
          address: getAreaAddressPrefix(st.area),
          isVerified: true,
        },
      });
      successCount++;
      console.log(`  ✅ [chain] [${st.area}] ${st.name}`);
    }
    console.log(`  ✅ チェーン店オーナー: 株式会社名古屋ナイトワークス (${chainStores.length}店舗)`);
  } catch (error) {
    errorCount++;
    console.error(`  ❌ 多店舗オーナー seed 失敗:`, error);
  }

  console.log(`\n🎉 完了: ${successCount} 件成功, ${errorCount} 件エラー`);
}

main()
  .catch((e) => {
    console.error("シード実行エラー:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
