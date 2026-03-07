export interface Scores {
  charm: number;
  intellect: number;
  warmth: number;
  energy: number;
}

export interface Choice {
  text: string;
  scores: Scores;
}

export interface Question {
  text: string;
  choices: Choice[];
}

export interface StyleType {
  id: string;
  name: string;
  description: string;
  strengths: string[];
  advice: string;
}

export const QUESTIONS: Question[] = [
  {
    text: "お客様が来店された瞬間、あなたが一番に考えることは？",
    choices: [
      { text: "目を見てとびきりの笑顔で迎えたい", scores: { charm: 3, intellect: 0, warmth: 1, energy: 1 } },
      { text: "今日はどんな気分なのか察したい", scores: { charm: 0, intellect: 3, warmth: 1, energy: 0 } },
      { text: "まずはリラックスできる空気を作りたい", scores: { charm: 0, intellect: 1, warmth: 3, energy: 0 } },
      { text: "テンション上げて盛り上げたい！", scores: { charm: 1, intellect: 0, warmth: 0, energy: 3 } },
    ],
  },
  {
    text: "お客様が少し元気がないとき、どう対応する？",
    choices: [
      { text: "さりげなくボディタッチして元気づける", scores: { charm: 3, intellect: 0, warmth: 1, energy: 0 } },
      { text: "何かあったか聞いて一緒に考える", scores: { charm: 0, intellect: 2, warmth: 2, energy: 0 } },
      { text: "何も聞かず隣にいてあげる", scores: { charm: 0, intellect: 0, warmth: 3, energy: 0 } },
      { text: "面白い話で笑わせる", scores: { charm: 1, intellect: 0, warmth: 0, energy: 3 } },
    ],
  },
  {
    text: "グループのお席でのあなたの立ち位置は？",
    choices: [
      { text: "全員の視線を集めるセンター", scores: { charm: 3, intellect: 0, warmth: 0, energy: 1 } },
      { text: "話題を広げる会話のハブ役", scores: { charm: 0, intellect: 3, warmth: 0, energy: 1 } },
      { text: "一人ひとりに寄り添うフォロー役", scores: { charm: 0, intellect: 0, warmth: 3, energy: 1 } },
      { text: "盛り上げ担当ムードメーカー", scores: { charm: 1, intellect: 0, warmth: 0, energy: 3 } },
    ],
  },
  {
    text: "お客様に「また来たい」と思ってもらうために大切にしていることは？",
    choices: [
      { text: "「あなただけ特別」と感じさせるテクニック", scores: { charm: 3, intellect: 1, warmth: 0, energy: 0 } },
      { text: "前回の会話を覚えていて話題にする", scores: { charm: 0, intellect: 3, warmth: 1, energy: 0 } },
      { text: "本音で話せる安心感を作る", scores: { charm: 0, intellect: 0, warmth: 3, energy: 0 } },
      { text: "毎回新しい楽しさを提供する", scores: { charm: 0, intellect: 1, warmth: 0, energy: 3 } },
    ],
  },
  {
    text: "接客で褒められて一番嬉しい言葉は？",
    choices: [
      { text: "「目が離せないくらい魅力的」", scores: { charm: 3, intellect: 0, warmth: 0, energy: 1 } },
      { text: "「話していると勉強になる」", scores: { charm: 0, intellect: 3, warmth: 0, energy: 0 } },
      { text: "「一緒にいるとホッとする」", scores: { charm: 0, intellect: 0, warmth: 3, energy: 0 } },
      { text: "「いつも楽しい時間をありがとう」", scores: { charm: 0, intellect: 0, warmth: 1, energy: 3 } },
    ],
  },
  {
    text: "自分の一番の武器は？",
    choices: [
      { text: "人を虜にする色気と華やかさ", scores: { charm: 3, intellect: 0, warmth: 1, energy: 0 } },
      { text: "気配りと空気を読む力", scores: { charm: 0, intellect: 3, warmth: 1, energy: 0 } },
      { text: "どんな人も受け入れる包容力", scores: { charm: 1, intellect: 0, warmth: 3, energy: 0 } },
      { text: "場を明るくするパワーと笑顔", scores: { charm: 0, intellect: 0, warmth: 0, energy: 3 } },
    ],
  },
];

export const STYLE_TYPES: StyleType[] = [
  {
    id: "madonna",
    name: "癒し系マドンナ",
    description: "あなたの最大の武器は、誰もが安心できる温かい雰囲気。お客様の心をそっと包み込み、「この子といると落ち着く」と思わせる天性の癒しオーラの持ち主です。",
    strengths: ["包容力", "聞き上手", "安心感", "母性的な優しさ"],
    advice: "あなたの温かさはそのままに、たまに見せるギャップが効果的。ふとした瞬間の甘え上手な一面を見せると、お客様のハートを鷲掴みにできますよ。",
  },
  {
    id: "entertainer",
    name: "華やかエンターテイナー",
    description: "あなたがいるだけで場が華やぐ、生まれながらのエンターテイナー。笑顔と元気でお客様を楽しませる天才です。「この子と飲むと元気になる」と言われるタイプ。",
    strengths: ["明るさ", "トーク力", "場を盛り上げる力", "ポジティブさ"],
    advice: "持ち前のパワフルさは最高の武器。でも、時には静かに寄り添う瞬間を作ると、お客様は「この子にはいろんな面がある」と魅了されますよ。",
  },
  {
    id: "muse",
    name: "知的ミューズ",
    description: "鋭い洞察力と気配りで、お客様一人ひとりに合わせた最高の時間を提供できるあなた。「この子は頭がいい」と一目置かれる知性派。会話のレベルが違います。",
    strengths: ["観察力", "会話力", "気配り", "臨機応変な対応"],
    advice: "知性は大きな魅力ですが、完璧すぎると近寄りがたく見えることも。少しだけ隙を見せると、お客様は「守ってあげたい」と感じてくれますよ。",
  },
  {
    id: "charisma",
    name: "魅惑のカリスマ",
    description: "あなたには人を惹きつける圧倒的なオーラがあります。視線、仕草、言葉遣い——すべてが計算されたかのように魅力的。「この子から目が離せない」と思わせるカリスマ性の持ち主。",
    strengths: ["華やかさ", "色気", "存在感", "特別感の演出"],
    advice: "カリスマ性は天性のもの。さらに磨くなら、お客様への「特別扱い」を極めましょう。「自分だけに見せてくれる笑顔がある」と感じさせれば無敵です。",
  },
  {
    id: "princess",
    name: "甘え上手なプリンセス",
    description: "charm（魅力）とwarmth（包容力）を兼ね備えたあなたは、甘え上手でありながら相手を癒す力も持つ最強コンビネーション。お客様の「守ってあげたい」欲求を刺激する天才です。",
    strengths: ["甘え力", "可愛げ", "素直さ", "感謝を伝える力"],
    advice: "甘えるだけでなく、時にはお客様を立てる一言を。「あなたのおかげで楽しい」という感謝の気持ちを伝えると、リピーターが倍増しますよ。",
  },
  {
    id: "bigsis",
    name: "頼れるお姉さん",
    description: "知性と活力を兼ね備えたあなたは、場を仕切りながらも楽しませる万能タイプ。後輩からも慕われ、お客様からは「この子がいれば大丈夫」と絶大な信頼を寄せられる存在です。",
    strengths: ["リーダーシップ", "判断力", "面倒見の良さ", "安定感"],
    advice: "頼られることが多い分、たまには自分も甘えてみて。「実は私も弱いところがあるの」と見せると、お客様との距離がグッと縮まりますよ。",
  },
];
