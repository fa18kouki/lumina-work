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

// ヘルパー: 現在から指定日数・時間後の日時を返す
function addDaysFromNow(days: number, hours: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hours, 0, 0, 0);
  return d;
}

async function main() {
  console.log("🌱 シードデータの投入を開始します...");

  // ==================== 店舗ユーザー + 店舗プロフィール ====================

  const stores = [
    {
      email: "seed-store-luna@example.com",
      store: {
        name: "Club LUNA",
        area: "六本木",
        address: "東京都港区六本木3-10-5",
        description:
          "六本木の一等地に佇む高級キャバクラ。落ち着いた内装と上質な接客で、企業役員や著名人のお客様に愛されています。未経験でも丁寧に指導いたします。",
        photos: [],
        businessHours: "20:00〜翌1:00",
        salarySystem: {
          hourlyRateMin: 5000,
          hourlyRateMax: 12000,
          nominationBackMin: 1000,
          nominationBackMax: 3000,
          drinkBackMin: 500,
          drinkBackMax: 1500,
        },
        benefits: [
          "送迎あり",
          "日払いOK",
          "ヘアメイク完備",
          "ドレス貸出無料",
          "ノルマなし",
        ],
        isVerified: true,
      },
    },
    {
      email: "seed-store-stella@example.com",
      store: {
        name: "Girls Bar STELLA",
        area: "渋谷",
        address: "東京都渋谷区道玄坂2-15-1",
        description:
          "渋谷駅から徒歩3分のカジュアルなガールズバー。20代前半のスタッフが中心で、アットホームな雰囲気が自慢です。Wワーク・学生さん歓迎！",
        photos: [],
        businessHours: "18:00〜翌2:00",
        salarySystem: {
          hourlyRateMin: 3000,
          hourlyRateMax: 5000,
          drinkBackMin: 300,
          drinkBackMax: 500,
        },
        benefits: ["日払いOK", "交通費支給", "自由出勤", "髪型・ネイル自由"],
        isVerified: true,
      },
    },
    {
      email: "seed-store-amour@example.com",
      store: {
        name: "Lounge AMOUR",
        area: "銀座",
        address: "東京都中央区銀座7-5-12",
        description:
          "銀座の老舗ラウンジ。30代以上の落ち着いた大人の女性も活躍中。会話力を重視した採用で、経験者優遇。週1〜OK。",
        photos: [],
        businessHours: "19:00〜翌0:00",
        salarySystem: {
          hourlyRateMin: 4000,
          hourlyRateMax: 8000,
          nominationBackMin: 1500,
          nominationBackMax: 3000,
          companionBackMin: 3000,
          companionBackMax: 5000,
        },
        benefits: [
          "送迎あり",
          "日払いOK",
          "週1OK",
          "30代活躍中",
          "ママ在籍",
        ],
        isVerified: true,
      },
    },
    {
      email: "seed-store-brilliance@example.com",
      store: {
        name: "Club Brilliance",
        area: "新宿",
        address: "東京都新宿区歌舞伎町1-8-3",
        description:
          "歌舞伎町エリア最大級のキャバクラ。広々とした店内で100名以上の在籍キャスト。圧倒的な集客力で安定した指名が見込めます。",
        photos: [],
        businessHours: "20:00〜翌1:00",
        salarySystem: {
          hourlyRateMin: 4000,
          hourlyRateMax: 10000,
          nominationBackMin: 1000,
          nominationBackMax: 2500,
          drinkBackMin: 500,
          drinkBackMax: 1000,
          salesBackMinPercent: 10,
          salesBackMaxPercent: 25,
        },
        benefits: [
          "送迎あり",
          "日払いOK",
          "週払いOK",
          "ヘアメイク完備",
          "ドレス貸出無料",
          "未経験歓迎",
          "経験者優遇",
          "ノルマなし",
          "罰金なし",
        ],
        isVerified: true,
      },
    },
    {
      email: "seed-store-elegance@example.com",
      store: {
        name: "Lounge Elegance",
        area: "赤坂",
        address: "東京都港区赤坂3-2-8",
        description:
          "赤坂の隠れ家的ラウンジ。政財界のお客様が多く、上品で知的な会話が求められます。経験者のみの少数精鋭店。",
        photos: [],
        businessHours: "19:00〜翌0:00",
        salarySystem: {
          hourlyRateMin: 6000,
          hourlyRateMax: 15000,
          companionBackMin: 5000,
          companionBackMax: 10000,
          nominationBackMin: 2000,
          nominationBackMax: 5000,
        },
        benefits: [
          "送迎あり",
          "日払いOK",
          "週1OK",
          "経験者優遇",
          "高時給保証",
          "終電上がりOK",
        ],
        isVerified: true,
      },
    },
    {
      email: "seed-store-paradise@example.com",
      store: {
        name: "Girls Bar Paradise",
        area: "池袋",
        address: "東京都豊島区西池袋1-12-5",
        description:
          "池袋駅西口すぐのガールズバー。カウンター越しの気軽な接客スタイル。お酒が飲めなくてもOK！初めてのナイトワークにぴったり。",
        photos: [],
        businessHours: "17:00〜翌2:00",
        salarySystem: {
          hourlyRateMin: 2500,
          hourlyRateMax: 4000,
          drinkBackMin: 200,
          drinkBackMax: 500,
        },
        benefits: [
          "日払いOK",
          "交通費支給",
          "自由出勤",
          "未経験歓迎",
          "髪型・ネイル自由",
          "終電上がりOK",
          "週1日からOK",
        ],
        isVerified: true,
      },
    },
    {
      email: "seed-store-velvet@example.com",
      store: {
        name: "Club Velvet",
        area: "銀座",
        address: "東京都中央区銀座8-3-11",
        description:
          "銀座8丁目の会員制クラブ。厳選されたお客様のみをお迎えする最高級店。月収100万円以上のキャスト多数在籍。",
        photos: [],
        businessHours: "20:00〜翌1:00",
        salarySystem: {
          hourlyRateMin: 8000,
          hourlyRateMax: 20000,
          companionBackMin: 5000,
          companionBackMax: 15000,
          nominationBackMin: 3000,
          nominationBackMax: 8000,
          salesBackMinPercent: 15,
          salesBackMaxPercent: 35,
        },
        benefits: [
          "送迎あり",
          "日払いOK",
          "ヘアメイク完備",
          "ドレス貸出無料",
          "経験者優遇",
          "高時給保証",
          "寮完備",
        ],
        isVerified: true,
      },
    },
    {
      email: "seed-store-noel@example.com",
      store: {
        name: "Snack Noël",
        area: "恵比寿",
        address: "東京都渋谷区恵比寿南1-5-7",
        description:
          "恵比寿の大人のスナック。ママと一緒にアットホームな接客。お客様との距離が近く、常連さんが多いお店です。",
        photos: [],
        businessHours: "19:00〜翌1:00",
        salarySystem: {
          hourlyRateMin: 2500,
          hourlyRateMax: 4000,
          drinkBackMin: 300,
          drinkBackMax: 500,
        },
        benefits: [
          "日払いOK",
          "週1OK",
          "30代活躍中",
          "40代活躍中",
          "ママ在籍",
          "アットホーム",
          "終電上がりOK",
        ],
        isVerified: true,
      },
    },
    {
      email: "seed-store-cherry@example.com",
      store: {
        name: "Girls Bar Cherry",
        area: "新宿",
        address: "東京都新宿区歌舞伎町2-25-3",
        description:
          "歌舞伎町の人気ガールズバー。明るく元気なスタッフが中心。お客様も20〜30代が多く、楽しい雰囲気のお店です。",
        photos: [],
        businessHours: "18:00〜翌3:00",
        salarySystem: {
          hourlyRateMin: 3000,
          hourlyRateMax: 5000,
          drinkBackMin: 300,
          drinkBackMax: 800,
        },
        benefits: [
          "日払いOK",
          "交通費支給",
          "自由出勤",
          "未経験歓迎",
          "友達紹介制度",
          "髪型・ネイル自由",
        ],
        isVerified: true,
      },
    },
    {
      email: "seed-store-azure@example.com",
      store: {
        name: "Lounge Azure",
        area: "六本木",
        address: "東京都港区六本木5-18-2",
        description:
          "六本木の高級ラウンジ。外国人のお客様も多く、語学力がある方は優遇。インターナショナルな雰囲気が特徴です。",
        photos: [],
        businessHours: "19:00〜翌1:00",
        salarySystem: {
          hourlyRateMin: 5000,
          hourlyRateMax: 12000,
          companionBackMin: 3000,
          companionBackMax: 8000,
          nominationBackMin: 2000,
          nominationBackMax: 5000,
        },
        benefits: [
          "送迎あり",
          "日払いOK",
          "ヘアメイク完備",
          "ドレス貸出無料",
          "語学力活かせる",
          "経験者優遇",
        ],
        isVerified: true,
      },
    },
  ];

  const createdStores: { userId: string; storeId: string; ownerId: string }[] = [];

  for (const s of stores) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        role: "OWNER",
        emailVerified: new Date(),
      },
    });

    const owner = await prisma.owner.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    const store = await prisma.store.upsert({
      where: { id: `seed-${s.email}` },
      update: s.store,
      create: {
        ownerId: owner.id,
        ...s.store,
      },
    });

    createdStores.push({ userId: user.id, storeId: store.id, ownerId: owner.id });
    console.log(`  ✅ 店舗: ${s.store.name}`);
  }

  // ==================== キャストユーザー + キャストプロフィール ====================

  const casts = [
    {
      email: "seed-cast-airi@example.com",
      cast: {
        nickname: "あいり",
        age: 22,
        description: "新宿・歌舞伎町エリアで3年の経験があります。明るい性格で場を盛り上げるのが得意です！",
        photos: [],
        desiredAreas: ["新宿", "歌舞伎町"],
        desiredHourlyRate: 5000,
        desiredMonthlyIncome: 500000,
        availableDaysPerWeek: 4,
        totalExperienceYears: 3,
        previousHourlyRate: 4500,
        monthlySales: 800000,
        monthlyNominations: 15,
        alcoholTolerance: "STRONG" as const,
        preferredAtmosphere: ["ワイワイ系", "にぎやか"],
        preferredClientele: ["若い客層", "サラリーマン"],
        rank: "A" as const,
        idVerified: true,
        idVerificationStatus: "VERIFIED" as const,
        diagnosisCompleted: true,
        diagnosisCompletedAt: new Date(),
      },
      experiences: [
        { area: "歌舞伎町", businessType: "CABARET" as const, durationMonths: 24 },
        { area: "新宿", businessType: "GIRLS_BAR" as const, durationMonths: 12 },
      ],
    },
    {
      email: "seed-cast-misaki@example.com",
      cast: {
        nickname: "みさき",
        age: 24,
        description: "六本木・銀座エリアの高級店で5年勤務。指名本数トップクラスの実績あり。接客には自信があります。",
        photos: [],
        desiredAreas: ["六本木", "銀座"],
        desiredHourlyRate: 8000,
        desiredMonthlyIncome: 1000000,
        availableDaysPerWeek: 5,
        totalExperienceYears: 5,
        previousHourlyRate: 7000,
        monthlySales: 2000000,
        monthlyNominations: 30,
        alcoholTolerance: "MODERATE" as const,
        preferredAtmosphere: ["落ち着いた店", "高級感"],
        preferredClientele: ["企業役員", "富裕層"],
        rank: "S" as const,
        idVerified: true,
        idVerificationStatus: "VERIFIED" as const,
        diagnosisCompleted: true,
        diagnosisCompletedAt: new Date(),
        birthdaySales: 5000000,
        hasVipClients: true,
        vipClientDescription: "上場企業役員のお客様が複数名",
        socialFollowers: 15000,
      },
      experiences: [
        { area: "六本木", businessType: "CLUB" as const, durationMonths: 36 },
        { area: "銀座", businessType: "LOUNGE" as const, durationMonths: 24 },
      ],
    },
    {
      email: "seed-cast-sakura@example.com",
      cast: {
        nickname: "さくら",
        age: 20,
        description: "渋谷エリアでガールズバー経験1年。大学生との両立をしています。笑顔と元気が取り柄です！",
        photos: [],
        desiredAreas: ["渋谷", "恵比寿"],
        desiredHourlyRate: 3500,
        desiredMonthlyIncome: 200000,
        availableDaysPerWeek: 3,
        totalExperienceYears: 1,
        previousHourlyRate: 3000,
        monthlySales: 300000,
        monthlyNominations: 5,
        alcoholTolerance: "WEAK" as const,
        preferredAtmosphere: ["カジュアル", "アットホーム"],
        preferredClientele: ["若い客層"],
        rank: "B" as const,
        idVerified: true,
        idVerificationStatus: "VERIFIED" as const,
        diagnosisCompleted: true,
        diagnosisCompletedAt: new Date(),
      },
      experiences: [
        { area: "渋谷", businessType: "GIRLS_BAR" as const, durationMonths: 12 },
      ],
    },
    {
      email: "seed-cast-rena@example.com",
      cast: {
        nickname: "れな",
        age: 23,
        description: "銀座・赤坂の落ち着いた雰囲気のお店で4年の経験。会話力に自信があり、リピーターのお客様が多いです。",
        photos: [],
        desiredAreas: ["銀座", "赤坂"],
        desiredHourlyRate: 6000,
        desiredMonthlyIncome: 700000,
        availableDaysPerWeek: 4,
        totalExperienceYears: 4,
        previousHourlyRate: 5500,
        monthlySales: 1200000,
        monthlyNominations: 20,
        alcoholTolerance: "MODERATE" as const,
        preferredAtmosphere: ["落ち着いた店", "大人の雰囲気"],
        preferredClientele: ["企業役員", "年配のお客様"],
        rank: "A" as const,
        idVerified: true,
        idVerificationStatus: "VERIFIED" as const,
        diagnosisCompleted: true,
        diagnosisCompletedAt: new Date(),
      },
      experiences: [
        { area: "銀座", businessType: "LOUNGE" as const, durationMonths: 30 },
        { area: "赤坂", businessType: "CLUB" as const, durationMonths: 18 },
      ],
    },
    {
      email: "seed-cast-yui@example.com",
      cast: {
        nickname: "ゆい",
        age: 21,
        description: "池袋エリアで半年ほど勤務しました。まだ経験は浅いですが、やる気は誰にも負けません！",
        photos: [],
        desiredAreas: ["池袋", "新宿"],
        desiredHourlyRate: 3500,
        desiredMonthlyIncome: 250000,
        availableDaysPerWeek: 3,
        totalExperienceYears: 0,
        previousHourlyRate: 3000,
        monthlySales: 200000,
        monthlyNominations: 3,
        alcoholTolerance: "WEAK" as const,
        preferredAtmosphere: ["アットホーム", "にぎやか"],
        preferredClientele: ["サラリーマン", "若い客層"],
        rank: "C" as const,
        idVerified: true,
        idVerificationStatus: "VERIFIED" as const,
        diagnosisCompleted: true,
        diagnosisCompletedAt: new Date(),
      },
      experiences: [
        { area: "池袋", businessType: "CABARET" as const, durationMonths: 6 },
      ],
    },
    {
      email: "seed-cast-mao@example.com",
      cast: {
        nickname: "まお",
        age: 25,
        description: "六本木・銀座の最高級店で7年のキャリア。バースデーイベントでは500万超えの実績。SNSフォロワー2万人超。",
        photos: [],
        desiredAreas: ["六本木", "銀座"],
        desiredHourlyRate: 10000,
        desiredMonthlyIncome: 2000000,
        availableDaysPerWeek: 5,
        totalExperienceYears: 7,
        previousHourlyRate: 9000,
        monthlySales: 3000000,
        monthlyNominations: 40,
        alcoholTolerance: "STRONG" as const,
        preferredAtmosphere: ["高級感", "落ち着いた店"],
        preferredClientele: ["富裕層", "企業役員", "著名人"],
        rank: "S" as const,
        idVerified: true,
        idVerificationStatus: "VERIFIED" as const,
        diagnosisCompleted: true,
        diagnosisCompletedAt: new Date(),
        birthdaySales: 8000000,
        hasVipClients: true,
        vipClientDescription: "上場企業CEO、芸能関係者など多数",
        socialFollowers: 25000,
      },
      experiences: [
        { area: "六本木", businessType: "CLUB" as const, durationMonths: 48 },
        { area: "銀座", businessType: "CLUB" as const, durationMonths: 36 },
      ],
    },
    {
      email: "seed-cast-hinata@example.com",
      cast: {
        nickname: "ひなた",
        age: 19,
        description: "完全未経験ですが、接客業に興味があり応募しました。渋谷エリア希望です。",
        photos: [],
        desiredAreas: ["渋谷"],
        desiredHourlyRate: 3000,
        desiredMonthlyIncome: 150000,
        availableDaysPerWeek: 2,
        totalExperienceYears: 0,
        alcoholTolerance: "NONE" as const,
        preferredAtmosphere: ["カジュアル", "アットホーム"],
        preferredClientele: ["若い客層"],
        rank: "C" as const,
        idVerified: true,
        idVerificationStatus: "VERIFIED" as const,
        diagnosisCompleted: false,
      },
      experiences: [],
    },
    {
      email: "seed-cast-riko@example.com",
      cast: {
        nickname: "りこ",
        age: 26,
        description: "歌舞伎町と池袋で2年ほど経験があります。しっかり稼ぎたいので出勤日数も多めにできます。",
        photos: [],
        desiredAreas: ["歌舞伎町", "池袋"],
        desiredHourlyRate: 4500,
        desiredMonthlyIncome: 400000,
        availableDaysPerWeek: 5,
        totalExperienceYears: 2,
        previousHourlyRate: 4000,
        monthlySales: 500000,
        monthlyNominations: 10,
        alcoholTolerance: "MODERATE" as const,
        preferredAtmosphere: ["にぎやか", "ワイワイ系"],
        preferredClientele: ["サラリーマン"],
        rank: "B" as const,
        idVerified: true,
        idVerificationStatus: "VERIFIED" as const,
        diagnosisCompleted: true,
        diagnosisCompletedAt: new Date(),
      },
      experiences: [
        { area: "歌舞伎町", businessType: "CABARET" as const, durationMonths: 18 },
        { area: "池袋", businessType: "GIRLS_BAR" as const, durationMonths: 6 },
      ],
    },
    // ---- 追加キャスト ----
    {
      email: "seed-cast-nana@example.com",
      cast: {
        nickname: "なな",
        age: 22,
        description: "六本木のクラブで2年の経験。同伴やアフターも積極的にこなしています。トーク力には自信あり！",
        photos: [],
        desiredAreas: ["六本木", "赤坂"],
        desiredHourlyRate: 6000,
        desiredMonthlyIncome: 600000,
        availableDaysPerWeek: 4,
        totalExperienceYears: 2,
        previousHourlyRate: 5000,
        monthlySales: 900000,
        monthlyNominations: 12,
        alcoholTolerance: "STRONG" as const,
        preferredAtmosphere: ["高級感", "にぎやか"],
        preferredClientele: ["企業役員", "サラリーマン"],
        rank: "A" as const,
        idVerified: true,
        idVerificationStatus: "VERIFIED" as const,
        diagnosisCompleted: true,
        diagnosisCompletedAt: new Date(),
      },
      experiences: [
        { area: "六本木", businessType: "CLUB" as const, durationMonths: 24 },
      ],
    },
    {
      email: "seed-cast-miku@example.com",
      cast: {
        nickname: "みく",
        age: 20,
        description: "新宿でガールズバー経験半年。友達に誘われて始めましたが、楽しくて続けています！",
        photos: [],
        desiredAreas: ["新宿", "渋谷"],
        desiredHourlyRate: 3000,
        desiredMonthlyIncome: 180000,
        availableDaysPerWeek: 3,
        totalExperienceYears: 0,
        previousHourlyRate: 2800,
        monthlySales: 150000,
        monthlyNominations: 2,
        alcoholTolerance: "WEAK" as const,
        preferredAtmosphere: ["カジュアル", "アットホーム"],
        preferredClientele: ["若い客層"],
        rank: "C" as const,
        idVerified: true,
        idVerificationStatus: "VERIFIED" as const,
        diagnosisCompleted: true,
        diagnosisCompletedAt: new Date(),
      },
      experiences: [
        { area: "新宿", businessType: "GIRLS_BAR" as const, durationMonths: 6 },
      ],
    },
    {
      email: "seed-cast-karen@example.com",
      cast: {
        nickname: "かれん",
        age: 27,
        description: "銀座のクラブで6年のキャリア。ナンバー入り経験あり。お客様の心を掴む接客が得意です。",
        photos: [],
        desiredAreas: ["銀座", "六本木"],
        desiredHourlyRate: 9000,
        desiredMonthlyIncome: 1500000,
        availableDaysPerWeek: 5,
        totalExperienceYears: 6,
        previousHourlyRate: 8000,
        monthlySales: 2500000,
        monthlyNominations: 35,
        alcoholTolerance: "STRONG" as const,
        preferredAtmosphere: ["高級感", "落ち着いた店"],
        preferredClientele: ["富裕層", "企業役員"],
        rank: "S" as const,
        idVerified: true,
        idVerificationStatus: "VERIFIED" as const,
        diagnosisCompleted: true,
        diagnosisCompletedAt: new Date(),
        birthdaySales: 6000000,
        hasVipClients: true,
        vipClientDescription: "大手企業経営者多数",
        socialFollowers: 18000,
      },
      experiences: [
        { area: "銀座", businessType: "CLUB" as const, durationMonths: 48 },
        { area: "六本木", businessType: "CLUB" as const, durationMonths: 24 },
      ],
    },
    {
      email: "seed-cast-hana@example.com",
      cast: {
        nickname: "はな",
        age: 21,
        description: "恵比寿のスナックで1年勤務。お酒はあまり飲めませんが、話を聞くのが得意です。",
        photos: [],
        desiredAreas: ["恵比寿", "渋谷"],
        desiredHourlyRate: 3000,
        desiredMonthlyIncome: 200000,
        availableDaysPerWeek: 3,
        totalExperienceYears: 1,
        previousHourlyRate: 2500,
        monthlySales: 200000,
        monthlyNominations: 4,
        alcoholTolerance: "NONE" as const,
        preferredAtmosphere: ["アットホーム", "カジュアル"],
        preferredClientele: ["年配のお客様", "常連さん"],
        rank: "C" as const,
        idVerified: true,
        idVerificationStatus: "VERIFIED" as const,
        diagnosisCompleted: true,
        diagnosisCompletedAt: new Date(),
      },
      experiences: [
        { area: "恵比寿", businessType: "SNACK" as const, durationMonths: 12 },
      ],
    },
    {
      email: "seed-cast-mei@example.com",
      cast: {
        nickname: "めい",
        age: 23,
        description: "池袋と新宿で3年経験。指名のお客様を大切にするスタイルで、安定した売上を出しています。",
        photos: [],
        desiredAreas: ["池袋", "新宿"],
        desiredHourlyRate: 5000,
        desiredMonthlyIncome: 500000,
        availableDaysPerWeek: 4,
        totalExperienceYears: 3,
        previousHourlyRate: 4500,
        monthlySales: 700000,
        monthlyNominations: 18,
        alcoholTolerance: "MODERATE" as const,
        preferredAtmosphere: ["にぎやか", "ワイワイ系"],
        preferredClientele: ["サラリーマン", "若い客層"],
        rank: "A" as const,
        idVerified: true,
        idVerificationStatus: "VERIFIED" as const,
        diagnosisCompleted: true,
        diagnosisCompletedAt: new Date(),
      },
      experiences: [
        { area: "池袋", businessType: "CABARET" as const, durationMonths: 24 },
        { area: "新宿", businessType: "CABARET" as const, durationMonths: 12 },
      ],
    },
    {
      email: "seed-cast-sora@example.com",
      cast: {
        nickname: "そら",
        age: 19,
        description: "完全未経験。アパレル販売員の経験があり、接客には自信があります。新宿エリア希望。",
        photos: [],
        desiredAreas: ["新宿", "池袋"],
        desiredHourlyRate: 3000,
        desiredMonthlyIncome: 200000,
        availableDaysPerWeek: 3,
        totalExperienceYears: 0,
        alcoholTolerance: "WEAK" as const,
        preferredAtmosphere: ["カジュアル", "アットホーム"],
        preferredClientele: ["若い客層"],
        rank: "C" as const,
        idVerified: true,
        idVerificationStatus: "VERIFIED" as const,
        diagnosisCompleted: true,
        diagnosisCompletedAt: new Date(),
      },
      experiences: [],
    },
    {
      email: "seed-cast-rina@example.com",
      cast: {
        nickname: "りな",
        age: 24,
        description: "赤坂のラウンジで3年勤務。英語も話せるので外国人のお客様の接客も得意です。",
        photos: [],
        desiredAreas: ["赤坂", "六本木"],
        desiredHourlyRate: 7000,
        desiredMonthlyIncome: 800000,
        availableDaysPerWeek: 4,
        totalExperienceYears: 3,
        previousHourlyRate: 6000,
        monthlySales: 1000000,
        monthlyNominations: 15,
        alcoholTolerance: "MODERATE" as const,
        preferredAtmosphere: ["高級感", "落ち着いた店"],
        preferredClientele: ["企業役員", "外国人"],
        rank: "A" as const,
        idVerified: true,
        idVerificationStatus: "VERIFIED" as const,
        diagnosisCompleted: true,
        diagnosisCompletedAt: new Date(),
      },
      experiences: [
        { area: "赤坂", businessType: "LOUNGE" as const, durationMonths: 36 },
      ],
    },
    {
      email: "seed-cast-yua@example.com",
      cast: {
        nickname: "ゆあ",
        age: 22,
        description: "渋谷・恵比寿で2年。SNSの発信力を活かした集客が得意。フォロワー1万人。",
        photos: [],
        desiredAreas: ["渋谷", "恵比寿"],
        desiredHourlyRate: 5000,
        desiredMonthlyIncome: 450000,
        availableDaysPerWeek: 4,
        totalExperienceYears: 2,
        previousHourlyRate: 4000,
        monthlySales: 600000,
        monthlyNominations: 10,
        alcoholTolerance: "MODERATE" as const,
        preferredAtmosphere: ["にぎやか", "カジュアル"],
        preferredClientele: ["若い客層", "サラリーマン"],
        rank: "B" as const,
        idVerified: true,
        idVerificationStatus: "VERIFIED" as const,
        diagnosisCompleted: true,
        diagnosisCompletedAt: new Date(),
        socialFollowers: 10000,
      },
      experiences: [
        { area: "渋谷", businessType: "CABARET" as const, durationMonths: 18 },
        { area: "恵比寿", businessType: "GIRLS_BAR" as const, durationMonths: 6 },
      ],
    },
    {
      email: "seed-cast-tsubaki@example.com",
      cast: {
        nickname: "つばき",
        age: 28,
        description: "銀座の高級クラブで8年のベテラン。ナンバーワン経験あり。独立も視野に入れつつ活動中。",
        photos: [],
        desiredAreas: ["銀座"],
        desiredHourlyRate: 12000,
        desiredMonthlyIncome: 2500000,
        availableDaysPerWeek: 5,
        totalExperienceYears: 8,
        previousHourlyRate: 10000,
        monthlySales: 4000000,
        monthlyNominations: 50,
        alcoholTolerance: "STRONG" as const,
        preferredAtmosphere: ["高級感"],
        preferredClientele: ["富裕層", "企業役員", "著名人"],
        rank: "S" as const,
        idVerified: true,
        idVerificationStatus: "VERIFIED" as const,
        diagnosisCompleted: true,
        diagnosisCompletedAt: new Date(),
        birthdaySales: 10000000,
        hasVipClients: true,
        vipClientDescription: "IT企業創業者、医師、弁護士など多数",
        socialFollowers: 30000,
      },
      experiences: [
        { area: "銀座", businessType: "CLUB" as const, durationMonths: 72 },
        { area: "六本木", businessType: "CLUB" as const, durationMonths: 24 },
      ],
    },
    {
      email: "seed-cast-miyu@example.com",
      cast: {
        nickname: "みゆ",
        age: 20,
        description: "池袋のガールズバーで8ヶ月。大学との両立で週2〜3日出勤。元気と笑顔が武器です！",
        photos: [],
        desiredAreas: ["池袋", "新宿"],
        desiredHourlyRate: 3000,
        desiredMonthlyIncome: 150000,
        availableDaysPerWeek: 2,
        totalExperienceYears: 0,
        previousHourlyRate: 2800,
        monthlySales: 120000,
        monthlyNominations: 2,
        alcoholTolerance: "WEAK" as const,
        preferredAtmosphere: ["カジュアル", "にぎやか"],
        preferredClientele: ["若い客層"],
        rank: "C" as const,
        idVerified: true,
        idVerificationStatus: "VERIFIED" as const,
        diagnosisCompleted: true,
        diagnosisCompletedAt: new Date(),
      },
      experiences: [
        { area: "池袋", businessType: "GIRLS_BAR" as const, durationMonths: 8 },
      ],
    },
    {
      email: "seed-cast-emi@example.com",
      cast: {
        nickname: "えみ",
        age: 25,
        description: "歌舞伎町のキャバクラで4年。売上バックで稼ぐタイプ。同伴とアフターを欠かしません。",
        photos: [],
        desiredAreas: ["歌舞伎町", "新宿"],
        desiredHourlyRate: 6000,
        desiredMonthlyIncome: 700000,
        availableDaysPerWeek: 5,
        totalExperienceYears: 4,
        previousHourlyRate: 5500,
        monthlySales: 1100000,
        monthlyNominations: 22,
        alcoholTolerance: "STRONG" as const,
        preferredAtmosphere: ["にぎやか", "ワイワイ系"],
        preferredClientele: ["サラリーマン", "若い客層"],
        rank: "A" as const,
        idVerified: true,
        idVerificationStatus: "VERIFIED" as const,
        diagnosisCompleted: true,
        diagnosisCompletedAt: new Date(),
      },
      experiences: [
        { area: "歌舞伎町", businessType: "CABARET" as const, durationMonths: 36 },
        { area: "新宿", businessType: "CABARET" as const, durationMonths: 12 },
      ],
    },
    {
      email: "seed-cast-ayane@example.com",
      cast: {
        nickname: "あやね",
        age: 21,
        description: "完全未経験ですが、モデル活動の経験があります。六本木の高級店で働きたいです。",
        photos: [],
        desiredAreas: ["六本木", "銀座"],
        desiredHourlyRate: 5000,
        desiredMonthlyIncome: 400000,
        availableDaysPerWeek: 4,
        totalExperienceYears: 0,
        alcoholTolerance: "WEAK" as const,
        preferredAtmosphere: ["高級感", "落ち着いた店"],
        preferredClientele: ["富裕層"],
        rank: "C" as const,
        idVerified: true,
        idVerificationStatus: "VERIFIED" as const,
        diagnosisCompleted: true,
        diagnosisCompletedAt: new Date(),
        socialFollowers: 8000,
      },
      experiences: [],
    },
  ];

  const createdCasts: { userId: string; castId: string; nickname: string }[] = [];

  for (const c of casts) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        role: "CAST",
        emailVerified: new Date(),
      },
    });

    const cast = await prisma.cast.upsert({
      where: { userId: user.id },
      update: c.cast,
      create: {
        userId: user.id,
        ...c.cast,
      },
    });

    await prisma.castExperience.deleteMany({ where: { castId: cast.id } });
    for (const exp of c.experiences) {
      await prisma.castExperience.create({
        data: { castId: cast.id, ...exp },
      });
    }

    createdCasts.push({ userId: user.id, castId: cast.id, nickname: c.cast.nickname });
    console.log(`  ✅ キャスト: ${c.cast.nickname} (${c.cast.rank})`);
  }

  // ==================== オファー ====================

  const offerData: {
    storeIndex: number;
    castIndex: number;
    message: string;
    status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
    daysAgo: number;
  }[] = [
    // 既存3件
    { storeIndex: 0, castIndex: 0, message: "あいりさん、はじめまして！Club LUNAの採用担当です。プロフィールを拝見して、ぜひ一度お会いしたいと思いました。体験入店からでもOKですので、お気軽にご連絡ください！", status: "PENDING", daysAgo: 1 },
    { storeIndex: 1, castIndex: 2, message: "さくらさん、こんにちは！渋谷のGirls Bar STELLAです。学生さんも多いお店なので、きっと楽しく働けると思います。シフトの相談もお気軽にどうぞ♪", status: "ACCEPTED", daysAgo: 5 },
    { storeIndex: 2, castIndex: 1, message: "みさきさん、Lounge AMOURの店長です。銀座エリアでの豊富なご経験に興味を持ちました。ぜひ面接のお時間をいただけますか？", status: "REJECTED", daysAgo: 10 },
    // 追加オファー（様々なステータス）
    { storeIndex: 3, castIndex: 0, message: "あいりさん、Club Brillianceです！歌舞伎町の大型店で安定したお客様がいらっしゃいます。ぜひ一度見学にいらしてください。", status: "PENDING", daysAgo: 2 },
    { storeIndex: 3, castIndex: 8, message: "ななさん、Club Brillianceの採用です。六本木でのご経験を活かせるポジションがございます。", status: "ACCEPTED", daysAgo: 4 },
    { storeIndex: 4, castIndex: 3, message: "れなさん、Lounge Eleganceです。赤坂での4年のご経験に大変興味があります。当店の落ち着いた雰囲気にぴったりだと思います。", status: "ACCEPTED", daysAgo: 6 },
    { storeIndex: 4, castIndex: 10, message: "かれんさん、Lounge Eleganceの店長です。銀座での6年のキャリア、素晴らしいですね。ぜひ当店で力を発揮してください。", status: "PENDING", daysAgo: 1 },
    { storeIndex: 5, castIndex: 4, message: "ゆいさん、Girls Bar Paradiseです！池袋駅すぐで通いやすいですよ。未経験でも優しい先輩がサポートします。", status: "ACCEPTED", daysAgo: 8 },
    { storeIndex: 5, castIndex: 17, message: "みゆさん、Girls Bar Paradiseです。大学との両立を応援します！週2日からOKなので、ぜひご検討ください。", status: "PENDING", daysAgo: 3 },
    { storeIndex: 6, castIndex: 5, message: "まおさん、Club Velvetです。銀座8丁目の会員制クラブで、最高峰の環境をご用意しています。ぜひお話しさせてください。", status: "ACCEPTED", daysAgo: 7 },
    { storeIndex: 6, castIndex: 16, message: "つばきさん、Club Velvetの採用担当です。8年のキャリアに敬意を表します。ぜひ当店のトップキャストとしてお迎えしたいです。", status: "PENDING", daysAgo: 2 },
    { storeIndex: 7, castIndex: 11, message: "はなさん、Snack Noëlです。恵比寿のアットホームなスナックで、お酒が飲めなくても大丈夫ですよ。", status: "ACCEPTED", daysAgo: 9 },
    { storeIndex: 8, castIndex: 9, message: "みくさん、Girls Bar Cherryです！歌舞伎町で一番楽しいガールズバーを目指しています。一緒に盛り上げましょう！", status: "ACCEPTED", daysAgo: 5 },
    { storeIndex: 8, castIndex: 13, message: "そらさん、Girls Bar Cherryです。未経験大歓迎！接客経験があるなら即戦力ですね。", status: "PENDING", daysAgo: 1 },
    { storeIndex: 9, castIndex: 14, message: "りなさん、Lounge Azureです。英語が話せる方は当店でとても重宝します。六本木の国際的な環境でぜひ！", status: "ACCEPTED", daysAgo: 3 },
    { storeIndex: 9, castIndex: 19, message: "あやねさん、Lounge Azureの採用です。モデル経験をお持ちとのこと、当店の雰囲気にぴったりです。", status: "PENDING", daysAgo: 1 },
    { storeIndex: 0, castIndex: 12, message: "めいさん、Club LUNAです。池袋での3年の経験を六本木で活かしてみませんか？", status: "ACCEPTED", daysAgo: 6 },
    { storeIndex: 0, castIndex: 18, message: "えみさん、Club LUNAの採用担当です。歌舞伎町での4年のご経験、素晴らしいですね。", status: "PENDING", daysAgo: 2 },
    { storeIndex: 3, castIndex: 15, message: "ゆあさん、Club Brillianceです。SNSでの発信力があるキャストを求めています！", status: "ACCEPTED", daysAgo: 4 },
    { storeIndex: 1, castIndex: 6, message: "ひなたさん、Girls Bar STELLAです！未経験でも大丈夫。楽しく働ける環境です。", status: "REJECTED", daysAgo: 12 },
    { storeIndex: 2, castIndex: 7, message: "りこさん、Lounge AMOURです。経験者の方は優遇しています。ぜひ面接にお越しください。", status: "EXPIRED", daysAgo: 20 },
  ];

  const createdOffers: { id: string; storeIndex: number; castIndex: number; status: string }[] = [];

  for (const o of offerData) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (o.status === "EXPIRED" ? -5 : 7));

    const offer = await prisma.offer.create({
      data: {
        storeId: createdStores[o.storeIndex].storeId,
        castId: createdCasts[o.castIndex].castId,
        message: o.message,
        status: o.status,
        expiresAt,
        createdAt: new Date(Date.now() - o.daysAgo * 24 * 60 * 60 * 1000),
      },
    });

    createdOffers.push({ id: offer.id, storeIndex: o.storeIndex, castIndex: o.castIndex, status: o.status });
  }
  console.log(`  ✅ オファー: ${offerData.length}件`);

  // ==================== やりとり（Match）====================

  const matchData: { castIndex: number; storeIndex: number; status: "ACCEPTED" | "PENDING" | "REJECTED" }[] = [
    // ACCEPTED（チャット可能）
    { castIndex: 2, storeIndex: 1, status: "ACCEPTED" },   // さくら ↔ STELLA
    { castIndex: 1, storeIndex: 0, status: "ACCEPTED" },   // みさき ↔ LUNA
    { castIndex: 3, storeIndex: 2, status: "ACCEPTED" },   // れな ↔ AMOUR
    { castIndex: 8, storeIndex: 3, status: "ACCEPTED" },   // なな ↔ Brilliance
    { castIndex: 3, storeIndex: 4, status: "ACCEPTED" },   // れな ↔ Elegance
    { castIndex: 4, storeIndex: 5, status: "ACCEPTED" },   // ゆい ↔ Paradise
    { castIndex: 5, storeIndex: 6, status: "ACCEPTED" },   // まお ↔ Velvet
    { castIndex: 11, storeIndex: 7, status: "ACCEPTED" },  // はな ↔ Noël
    { castIndex: 9, storeIndex: 8, status: "ACCEPTED" },   // みく ↔ Cherry
    { castIndex: 14, storeIndex: 9, status: "ACCEPTED" },  // りな ↔ Azure
    { castIndex: 12, storeIndex: 0, status: "ACCEPTED" },  // めい ↔ LUNA
    { castIndex: 15, storeIndex: 3, status: "ACCEPTED" },  // ゆあ ↔ Brilliance
    // PENDING
    { castIndex: 4, storeIndex: 0, status: "PENDING" },    // ゆい ↔ LUNA
    { castIndex: 7, storeIndex: 1, status: "PENDING" },    // りこ ↔ STELLA
    { castIndex: 10, storeIndex: 4, status: "PENDING" },   // かれん ↔ Elegance
    { castIndex: 16, storeIndex: 6, status: "PENDING" },   // つばき ↔ Velvet
    { castIndex: 17, storeIndex: 5, status: "PENDING" },   // みゆ ↔ Paradise
    { castIndex: 13, storeIndex: 8, status: "PENDING" },   // そら ↔ Cherry
    { castIndex: 18, storeIndex: 0, status: "PENDING" },   // えみ ↔ LUNA
    { castIndex: 19, storeIndex: 9, status: "PENDING" },   // あやね ↔ Azure
    // REJECTED
    { castIndex: 6, storeIndex: 2, status: "REJECTED" },   // ひなた ↔ AMOUR
    { castIndex: 6, storeIndex: 1, status: "REJECTED" },   // ひなた ↔ STELLA
  ];

  const createdMatches: { id: string; castIndex: number; storeIndex: number; status: string }[] = [];

  for (const m of matchData) {
    const match = await prisma.match.upsert({
      where: {
        castId_storeId: {
          castId: createdCasts[m.castIndex].castId,
          storeId: createdStores[m.storeIndex].storeId,
        },
      },
      update: { status: m.status },
      create: {
        castId: createdCasts[m.castIndex].castId,
        storeId: createdStores[m.storeIndex].storeId,
        status: m.status,
      },
    });
    createdMatches.push({ id: match.id, castIndex: m.castIndex, storeIndex: m.storeIndex, status: m.status });
  }
  console.log(`  ✅ やりとり: ${matchData.length}件 (ACCEPTED: ${matchData.filter(m => m.status === "ACCEPTED").length}, PENDING: ${matchData.filter(m => m.status === "PENDING").length}, REJECTED: ${matchData.filter(m => m.status === "REJECTED").length})`);

  // ==================== メッセージ ====================

  const messageData: {
    castIndex: number;
    storeIndex: number;
    messages: { senderType: "cast" | "store"; content: string; minutesAgo: number }[];
  }[] = [
    {
      castIndex: 2, storeIndex: 1, // さくら ↔ STELLA
      messages: [
        { senderType: "store", content: "さくらさん、オファーを受けていただきありがとうございます！面接の日程を相談させてください。", minutesAgo: 2400 },
        { senderType: "cast", content: "こちらこそありがとうございます！今週の木曜日か金曜日の夕方はいかがでしょうか？", minutesAgo: 2100 },
        { senderType: "store", content: "木曜日18時でいかがですか？渋谷駅ハチ公口でお待ちしています。", minutesAgo: 1800 },
        { senderType: "cast", content: "木曜日18時、了解しました！よろしくお願いいたします。", minutesAgo: 1500 },
        { senderType: "store", content: "当日の持ち物は身分証明書だけで大丈夫です。お気軽にお越しください😊", minutesAgo: 1200 },
      ],
    },
    {
      castIndex: 1, storeIndex: 0, // みさき ↔ LUNA
      messages: [
        { senderType: "store", content: "みさきさん、Club LUNAです。六本木での豊富なご経験を拝見しました。ぜひ面接させてください！", minutesAgo: 3000 },
        { senderType: "cast", content: "ありがとうございます！ぜひお話しさせていただきたいです。", minutesAgo: 2800 },
        { senderType: "store", content: "明後日の14時はいかがでしょうか？お店でお待ちしています。", minutesAgo: 2600 },
        { senderType: "cast", content: "14時で大丈夫です。住所を教えていただけますか？", minutesAgo: 2400 },
        { senderType: "store", content: "港区六本木3-10-5のビル3階です。1階にコンビニがある建物です。", minutesAgo: 2200 },
        { senderType: "cast", content: "了解しました。当日よろしくお願いいたします！", minutesAgo: 2000 },
      ],
    },
    {
      castIndex: 3, storeIndex: 2, // れな ↔ AMOUR
      messages: [
        { senderType: "store", content: "れなさん、Lounge AMOURです。銀座での4年のご経験に興味があります。", minutesAgo: 4500 },
        { senderType: "cast", content: "お声がけありがとうございます。落ち着いた雰囲気のお店を探していたので嬉しいです。", minutesAgo: 4300 },
        { senderType: "store", content: "当店はまさに落ち着いた大人の雰囲気です。一度見学にいらっしゃいませんか？", minutesAgo: 4100 },
        { senderType: "cast", content: "ぜひ見学させてください。来週のどこかでお時間いただけますか？", minutesAgo: 3900 },
      ],
    },
    {
      castIndex: 8, storeIndex: 3, // なな ↔ Brilliance
      messages: [
        { senderType: "store", content: "ななさん、Club Brillianceです！トーク力に自信があるとのこと、当店でぜひ発揮してください。", minutesAgo: 1500 },
        { senderType: "cast", content: "ありがとうございます！大型店は初めてなので楽しみです。", minutesAgo: 1300 },
        { senderType: "store", content: "100名以上のキャストが在籍していますが、みんな仲良しですよ。体験入店はいつがよろしいですか？", minutesAgo: 1100 },
      ],
    },
    {
      castIndex: 3, storeIndex: 4, // れな ↔ Elegance
      messages: [
        { senderType: "store", content: "れなさん、Lounge Eleganceです。赤坂でのご経験を当店でも活かしていただけると嬉しいです。", minutesAgo: 2000 },
        { senderType: "cast", content: "赤坂は慣れたエリアなので安心です。一度お話しさせてください。", minutesAgo: 1800 },
      ],
    },
    {
      castIndex: 5, storeIndex: 6, // まお ↔ Velvet
      messages: [
        { senderType: "store", content: "まおさん、Club Velvetです。銀座の最高級店として、まおさんのような実力派キャストをお迎えしたいです。", minutesAgo: 5000 },
        { senderType: "cast", content: "ご連絡ありがとうございます。会員制クラブということで、客層も良さそうですね。", minutesAgo: 4800 },
        { senderType: "store", content: "はい、政財界のお客様が中心です。時給や待遇は直接お会いしてご相談させてください。", minutesAgo: 4600 },
        { senderType: "cast", content: "ぜひ面接の機会をいただきたいです。今週末は空いていますか？", minutesAgo: 4400 },
        { senderType: "store", content: "土曜日の15時はいかがですか？銀座8-3-11の当店にお越しください。", minutesAgo: 4200 },
      ],
    },
    {
      castIndex: 11, storeIndex: 7, // はな ↔ Noël
      messages: [
        { senderType: "store", content: "はなさん、Snack Noëlです。恵比寿でスナック経験があるとのこと、ぜひ当店でも！", minutesAgo: 800 },
        { senderType: "cast", content: "ありがとうございます！アットホームなお店が好きなので興味あります。", minutesAgo: 600 },
        { senderType: "store", content: "ママも優しいので安心してくださいね。見学だけでも大歓迎ですよ。", minutesAgo: 400 },
      ],
    },
    {
      castIndex: 9, storeIndex: 8, // みく ↔ Cherry
      messages: [
        { senderType: "store", content: "みくさん、Girls Bar Cherryです！新宿でのガールズバー経験を活かしてぜひ当店で！", minutesAgo: 1000 },
        { senderType: "cast", content: "楽しそうなお店ですね！友達と一緒に応募してもいいですか？", minutesAgo: 800 },
        { senderType: "store", content: "もちろん大歓迎です！友達紹介制度もありますよ。", minutesAgo: 600 },
        { senderType: "cast", content: "やった！来週の火曜日に二人で見学に行ってもいいですか？", minutesAgo: 400 },
      ],
    },
    {
      castIndex: 14, storeIndex: 9, // りな ↔ Azure
      messages: [
        { senderType: "store", content: "りなさん、Lounge Azureです。英語が話せるとのこと、当店では大変重宝されます。", minutesAgo: 1200 },
        { senderType: "cast", content: "Thank you! 国際的な環境で働くのが夢だったので嬉しいです。", minutesAgo: 1000 },
        { senderType: "store", content: "当店は外国人のお客様が3割ほどいらっしゃいます。りなさんにぴったりです！", minutesAgo: 800 },
      ],
    },
    {
      castIndex: 12, storeIndex: 0, // めい ↔ LUNA
      messages: [
        { senderType: "store", content: "めいさん、Club LUNAです。池袋での指名実績、素晴らしいですね。六本木でもきっと活躍できます。", minutesAgo: 700 },
        { senderType: "cast", content: "ありがとうございます！六本木は初めてなのでドキドキですが、頑張ります。", minutesAgo: 500 },
      ],
    },
    {
      castIndex: 15, storeIndex: 3, // ゆあ ↔ Brilliance
      messages: [
        { senderType: "store", content: "ゆあさん、Club Brillianceです。SNSフォロワー1万人は心強いです！当店の集客にも貢献していただけそう。", minutesAgo: 900 },
        { senderType: "cast", content: "SNS発信は得意です！お店のアカウントも手伝えますよ。", minutesAgo: 700 },
        { senderType: "store", content: "それは素晴らしい！ぜひ詳しくお話しましょう。体験入店はいつがご都合よろしいですか？", minutesAgo: 500 },
      ],
    },
  ];

  for (const mm of messageData) {
    const match = createdMatches.find(
      (m) => m.castIndex === mm.castIndex && m.storeIndex === mm.storeIndex
    );
    if (!match) continue;

    await prisma.message.deleteMany({ where: { matchId: match.id } });
    for (const msg of mm.messages) {
      const senderId =
        msg.senderType === "store"
          ? createdStores[mm.storeIndex].userId
          : createdCasts[mm.castIndex].userId;
      await prisma.message.create({
        data: {
          matchId: match.id,
          senderId,
          content: msg.content,
          isRead: msg.minutesAgo > 300,
          createdAt: new Date(Date.now() - msg.minutesAgo * 60 * 1000),
        },
      });
    }
  }
  console.log(`  ✅ メッセージ: ${messageData.reduce((sum, mm) => sum + mm.messages.length, 0)}件 (${messageData.length}件のやりとり)`);

  // ==================== 面接データ ====================

  // 面接にはACCEPTEDオファーが必要。ACCEPTEDオファーのIDを取得
  function findAcceptedOffer(storeIdx: number, castIdx: number): string | undefined {
    return createdOffers.find(
      (o) => o.storeIndex === storeIdx && o.castIndex === castIdx && o.status === "ACCEPTED"
    )?.id;
  }

  const interviewData: {
    storeIndex: number;
    castIndex: number;
    scheduledAt: Date;
    status: "SCHEDULED" | "COMPLETED" | "NO_SHOW" | "CANCELLED";
    notes: string | null;
  }[] = [
    { storeIndex: 0, castIndex: 1, scheduledAt: addDaysFromNow(2, 14), status: "SCHEDULED", notes: null },
    { storeIndex: 1, castIndex: 2, scheduledAt: addDaysFromNow(4, 16), status: "SCHEDULED", notes: null },
    { storeIndex: 3, castIndex: 8, scheduledAt: addDaysFromNow(1, 15), status: "SCHEDULED", notes: "体験入店希望" },
    { storeIndex: 4, castIndex: 3, scheduledAt: addDaysFromNow(3, 19), status: "SCHEDULED", notes: null },
    { storeIndex: 6, castIndex: 5, scheduledAt: addDaysFromNow(5, 15), status: "SCHEDULED", notes: "VIP対応経験について確認" },
    { storeIndex: 9, castIndex: 14, scheduledAt: addDaysFromNow(2, 18), status: "SCHEDULED", notes: "英語力の確認" },
    { storeIndex: 0, castIndex: 12, scheduledAt: addDaysFromNow(1, 14), status: "SCHEDULED", notes: null },
    { storeIndex: 2, castIndex: 3, scheduledAt: addDaysFromNow(-3, 15), status: "COMPLETED", notes: "明るく落ち着いた雰囲気で好印象。即日採用を提示。" },
    { storeIndex: 5, castIndex: 4, scheduledAt: addDaysFromNow(-4, 14), status: "COMPLETED", notes: "やる気十分。体験入店を来週に設定。" },
    { storeIndex: 7, castIndex: 11, scheduledAt: addDaysFromNow(-2, 19), status: "COMPLETED", notes: "スナック経験あり。ママとの相性も良好。採用決定。" },
    { storeIndex: 8, castIndex: 9, scheduledAt: addDaysFromNow(-1, 18), status: "COMPLETED", notes: "友人と二人で来店。二人とも採用。" },
    { storeIndex: 3, castIndex: 15, scheduledAt: addDaysFromNow(-3, 16), status: "COMPLETED", notes: "SNS活用の提案あり。マーケティング担当としても期待。" },
    { storeIndex: 0, castIndex: 4, scheduledAt: addDaysFromNow(-5, 14), status: "NO_SHOW", notes: "連絡なしで不参加。" },
    { storeIndex: 1, castIndex: 7, scheduledAt: addDaysFromNow(-7, 16), status: "NO_SHOW", notes: "当日キャンセル連絡後、来店なし。" },
    { storeIndex: 1, castIndex: 7, scheduledAt: addDaysFromNow(-2, 13), status: "CANCELLED", notes: "キャスト都合によりキャンセル。" },
    { storeIndex: 2, castIndex: 1, scheduledAt: addDaysFromNow(-8, 15), status: "CANCELLED", notes: "他店への入店が決まったため辞退。" },
  ];

  let interviewCount = 0;
  for (const iv of interviewData) {
    const offerId = findAcceptedOffer(iv.storeIndex, iv.castIndex);
    if (!offerId) continue;

    await prisma.interview.create({
      data: {
        offerId,
        castId: createdCasts[iv.castIndex].castId,
        storeId: createdStores[iv.storeIndex].storeId,
        scheduledAt: iv.scheduledAt,
        status: iv.status,
        notes: iv.notes,
      },
    });
    interviewCount++;
  }
  console.log(`  ✅ 面接: ${interviewCount}件 (SCHEDULED: ${interviewData.filter(i => i.status === "SCHEDULED").length}, COMPLETED: ${interviewData.filter(i => i.status === "COMPLETED").length}, NO_SHOW: ${interviewData.filter(i => i.status === "NO_SHOW").length}, CANCELLED: ${interviewData.filter(i => i.status === "CANCELLED").length})`);

  // ==================== サブスクリプション ====================

  const subscriptionData: { storeIndex: number; plan: "CASUAL" | "PRO_TRIAL" | "PRO_BUSINESS" | "PRO_ENTERPRISE"; offerLimit: number | null }[] = [
    { storeIndex: 0, plan: "PRO_TRIAL", offerLimit: null },
    { storeIndex: 1, plan: "CASUAL", offerLimit: 10 },
    { storeIndex: 2, plan: "CASUAL", offerLimit: 10 },
    { storeIndex: 3, plan: "PRO_ENTERPRISE", offerLimit: null },
    { storeIndex: 4, plan: "PRO_BUSINESS", offerLimit: null },
    { storeIndex: 5, plan: "CASUAL", offerLimit: 10 },
    { storeIndex: 6, plan: "PRO_ENTERPRISE", offerLimit: null },
    { storeIndex: 7, plan: "CASUAL", offerLimit: 10 },
    { storeIndex: 8, plan: "CASUAL", offerLimit: 10 },
    { storeIndex: 9, plan: "PRO_TRIAL", offerLimit: null },
  ];

  for (const sub of subscriptionData) {
    const ownerId = createdStores[sub.storeIndex].ownerId;
    await prisma.subscription.upsert({
      where: { ownerId },
      update: { plan: sub.plan, status: "ACTIVE", offerLimit: sub.offerLimit },
      create: {
        ownerId,
        plan: sub.plan,
        status: "ACTIVE",
        offerLimit: sub.offerLimit,
      },
    });
  }
  console.log(`  ✅ サブスクリプション: ${subscriptionData.length}件 (CASUAL: ${subscriptionData.filter(s => s.plan === "CASUAL").length}, PRO: ${subscriptionData.filter(s => s.plan !== "CASUAL").length})`);

  console.log("\n🎉 シードデータの投入が完了しました！");
  console.log(`  店舗: ${stores.length}件`);
  console.log(`  キャスト: ${casts.length}件`);
  console.log(`  オファー: ${offerData.length}件`);
  console.log(`  やりとり: ${matchData.length}件`);
  console.log(`  面接: ${interviewCount}件`);
  console.log(`  サブスクリプション: ${subscriptionData.length}件`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ シードデータの投入に失敗しました:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
