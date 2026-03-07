export interface CompatibilityType {
  typeName: string;
  comment: string;
  minPercentage: number;
}

export const COMPATIBILITY_TYPES: CompatibilityType[] = [
  {
    typeName: "運命の赤い糸",
    comment:
      "まるで前世から繋がっていたかのような奇跡的な相性。出会えたこと自体が運命と言えるほど、心と心が深く共鳴し合う二人です。",
    minPercentage: 95,
  },
  {
    typeName: "魂のパートナー",
    comment:
      "お互いの存在が自然と心を満たしてくれる、理想的な組み合わせ。言葉にしなくても通じ合える不思議な絆があります。",
    minPercentage: 90,
  },
  {
    typeName: "惹かれ合う情熱タイプ",
    comment:
      "お互いに強く惹かれ合う磁石のような二人。一緒にいるとドキドキが止まらない、刺激的で情熱的な関係です。",
    minPercentage: 85,
  },
  {
    typeName: "息ぴったりの名コンビ",
    comment:
      "テンポが合って会話も弾む最高のコンビ。笑いのツボも似ていて、一緒にいると時間があっという間に過ぎていきます。",
    minPercentage: 80,
  },
  {
    typeName: "じわじわハマる相性",
    comment:
      "最初はゆっくりでも、知れば知るほど魅力に気づく関係。時間をかけて深まる絆が、やがて特別なものになります。",
    minPercentage: 75,
  },
  {
    typeName: "意外性のスパイス",
    comment:
      "タイプは違えど、だからこそ新鮮な刺激がある組み合わせ。お互いの知らない世界を教え合える関係です。",
    minPercentage: 70,
  },
  {
    typeName: "これから花開く関係",
    comment:
      "まだお互いの魅力を発見しきれていないだけ。会話を重ねるほどに相性がどんどん上がっていくポテンシャルの塊です。",
    minPercentage: 65,
  },
  {
    typeName: "ミステリアスな引力",
    comment:
      "不思議な引力で結ばれた二人。真逆に見えて実は補い合える、謎めいた魅力のある組み合わせです。",
    minPercentage: 0,
  },
];

export const DETAIL_LABELS = [
  "恋愛の相性",
  "会話の相性",
  "価値観の一致度",
  "ドキドキ度",
  "長続き度",
] as const;

export interface LoveType {
  name: string;
  description: string;
}

export const LOVE_TYPES: LoveType[] = [
  { name: "情熱的リーダー", description: "周りを引っ張るカリスマ性で、恋愛でも積極的にリードするタイプ" },
  { name: "献身型ロマンチスト", description: "相手の幸せを第一に考える、愛情深く一途なタイプ" },
  { name: "知的ストラテジスト", description: "冷静な判断力と深い洞察力で、関係を大切に育てるタイプ" },
  { name: "癒し系マイペース", description: "穏やかな空気感で相手を癒す、自然体が魅力のタイプ" },
  { name: "自由奔放な冒険家", description: "新しい刺激を求める好奇心旺盛な、一緒にいて飽きないタイプ" },
  { name: "一途な守護者", description: "大切な人を守り抜く強さと優しさを兼ね備えた、頼れるタイプ" },
  { name: "ミステリアスな魅力家", description: "独特のオーラで人を惹きつける、つい気になってしまうタイプ" },
  { name: "天真爛漫なムードメーカー", description: "明るさと笑顔で場を盛り上げる、一緒にいると楽しいタイプ" },
  { name: "大人の包容力タイプ", description: "広い心で全てを受け止める、安心感を与えてくれるタイプ" },
  { name: "繊細なアーティスト", description: "感受性豊かで相手の気持ちに敏感な、心の機微がわかるタイプ" },
  { name: "社交的なエンターテイナー", description: "コミュニケーション上手で、どんな場でも楽しませてくれるタイプ" },
  { name: "直感型ドリーマー", description: "夢を追いかける情熱と直感力で、恋愛にもまっすぐなタイプ" },
];

export const LUCKY_COLORS = [
  "ピンク",
  "レッド",
  "オレンジ",
  "イエロー",
  "ライトブルー",
  "ネイビー",
  "パープル",
  "ホワイト",
  "ゴールド",
  "シルバー",
  "グリーン",
  "ローズピンク",
];

export const LUCKY_DATE_SPOTS = [
  "夜景の見えるレストラン",
  "水族館",
  "カフェ巡り",
  "映画館",
  "遊園地",
  "海辺の散歩",
  "温泉旅行",
  "プラネタリウム",
  "美術館",
  "フラワーガーデン",
  "ショッピングモール",
  "ホテルのアフタヌーンティー",
];

export const ADVICE_LIST = [
  "お互いの趣味を一緒に楽しんでみて。新しい共通点が見つかるはず。",
  "たまには相手の話をじっくり聞く時間を作ると、絆がもっと深まります。",
  "サプライズを仕掛けてみて。小さなプレゼントでも気持ちは大きく伝わります。",
  "一緒に笑える時間を大切に。ユーモアが二人の距離を縮めてくれます。",
  "素直に「ありがとう」を伝えることが、長続きの秘訣です。",
  "お互いの違いを楽しむ気持ちが、関係をもっと豊かにしてくれます。",
  "二人だけの特別なルーティンを作ると、絆が一層深まります。",
  "相手のペースを尊重しながら、少しずつ距離を縮めていくのがベスト。",
  "一緒に美味しいものを食べに行くと、自然と会話が弾みます。",
  "お互いの長所を褒め合うことで、関係がどんどん良くなっていきます。",
  "目を見て話す時間を意識的に増やすと、心の距離がぐっと近づきます。",
  "二人で同じ目標に向かって頑張ると、最高のパートナーになれます。",
];

/**
 * 星座のエレメント（火/地/風/水）
 * おひつじ・しし・いて = 火
 * おうし・おとめ・やぎ = 地
 * ふたご・てんびん・みずがめ = 風
 * かに・さそり・うお = 水
 */
export const ZODIAC_ELEMENTS: Record<string, "fire" | "earth" | "air" | "water"> = {
  "おひつじ座": "fire",
  "おうし座": "earth",
  "ふたご座": "air",
  "かに座": "water",
  "しし座": "fire",
  "おとめ座": "earth",
  "てんびん座": "air",
  "さそり座": "water",
  "いて座": "fire",
  "やぎ座": "earth",
  "みずがめ座": "air",
  "うお座": "water",
};

/**
 * エレメント相性テーブル (0〜10)
 * 同じエレメント=8, 火-風/地-水=9, 火-地/風-水=5, 火-水/地-風は逆方向で定義
 */
export const ELEMENT_COMPATIBILITY: Record<string, Record<string, number>> = {
  fire:  { fire: 8, earth: 5, air: 9, water: 4 },
  earth: { fire: 5, earth: 8, air: 4, water: 9 },
  air:   { fire: 9, earth: 4, air: 8, water: 5 },
  water: { fire: 4, earth: 9, air: 5, water: 8 },
};

/**
 * 血液型相性テーブル (0〜10)
 */
export const BLOOD_TYPE_COMPATIBILITY: Record<string, Record<string, number>> = {
  A:  { A: 7, B: 5, O: 9, AB: 6 },
  B:  { A: 5, B: 7, O: 6, AB: 8 },
  O:  { A: 9, B: 6, O: 7, AB: 5 },
  AB: { A: 6, B: 8, O: 5, AB: 7 },
};
