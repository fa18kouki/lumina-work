export interface DiagnosisScores {
  x: number; // negative=cool, positive=cute
  y: number; // negative=mysterious, positive=active
}

export interface DiagnosisChoice {
  text: string;
  scores: DiagnosisScores;
}

export interface DiagnosisQuestion {
  text: string;
  choices: DiagnosisChoice[];
}

export interface CharacterType {
  id: string;
  name: string;
  description: string;
  impression: string;
  specialMove: string;
  quadrant: { x: "cool" | "cute"; y: "mysterious" | "active" } | "extreme";
}

export const DIAGNOSIS_QUESTIONS: DiagnosisQuestion[] = [
  {
    text: "初対面のお客様への第一声は？",
    choices: [
      { text: "「待ってました！今日は楽しみましょう！」", scores: { x: 1, y: 2 } },
      { text: "「はじめまして...よろしくね」（照れ笑い）", scores: { x: 2, y: -1 } },
      { text: "「いらっしゃいませ。ご指名ありがとうございます」", scores: { x: -2, y: -1 } },
      { text: "「お会いできて嬉しい！何飲む？」", scores: { x: 1, y: 1 } },
    ],
  },
  {
    text: "お客様から「今日綺麗だね」と言われたら？",
    choices: [
      { text: "「えへへ、ありがとう！嬉しい！」", scores: { x: 2, y: 1 } },
      { text: "「ありがとう。あなたも素敵よ」", scores: { x: -1, y: -1 } },
      { text: "「もっと言って？」（上目遣い）", scores: { x: 1, y: -2 } },
      { text: "「当然でしょ？」（冗談っぽく）", scores: { x: -2, y: 2 } },
    ],
  },
  {
    text: "カラオケで選ぶ曲のジャンルは？",
    choices: [
      { text: "アイドルソングで盛り上げる", scores: { x: 2, y: 2 } },
      { text: "バラードをしっとり歌い上げる", scores: { x: -1, y: -2 } },
      { text: "ノリのいいダンスミュージック", scores: { x: 0, y: 2 } },
      { text: "ちょっとマニアックな曲で意外性を", scores: { x: -2, y: -1 } },
    ],
  },
  {
    text: "お客様と乾杯するときの仕草は？",
    choices: [
      { text: "両手でグラスを持ってにっこり", scores: { x: 2, y: 0 } },
      { text: "さりげなく目を合わせてクールに", scores: { x: -2, y: -1 } },
    ],
  },
  {
    text: "席での会話で得意なのは？",
    choices: [
      { text: "リアクション大きめで楽しく盛り上げる", scores: { x: 1, y: 2 } },
      { text: "深い話をじっくり聞いてあげる", scores: { x: -1, y: -2 } },
      { text: "可愛くおねだりしてワガママ言う", scores: { x: 2, y: -1 } },
      { text: "鋭いツッコミで笑いを取る", scores: { x: -1, y: 2 } },
    ],
  },
  {
    text: "お客様が帰るとき、どう見送る？",
    choices: [
      { text: "「次いつ来てくれるの？」と甘える", scores: { x: 2, y: -1 } },
      { text: "「今日は楽しかった！また来てね！」と元気に", scores: { x: 1, y: 2 } },
      { text: "「気をつけて帰ってね」とそっと微笑む", scores: { x: -1, y: -2 } },
      { text: "「次はもっと楽しませるから」とクールに予告", scores: { x: -2, y: 1 } },
    ],
  },
  {
    text: "SNSの自撮りのスタイルは？",
    choices: [
      { text: "キメ顔・ばっちりメイクでクール系", scores: { x: -2, y: 0 } },
      { text: "ピースや変顔で親しみやすく", scores: { x: 2, y: 2 } },
      { text: "ミステリアスに目元だけチラ見せ", scores: { x: 0, y: -2 } },
      { text: "アクティブな趣味やお出かけ写真", scores: { x: 0, y: 2 } },
    ],
  },
  {
    text: "理想のキャスト像は？",
    choices: [
      { text: "みんなに愛されるアイドル的存在", scores: { x: 2, y: 1 } },
      { text: "大人の余裕で魅了するNo.1", scores: { x: -2, y: -1 } },
      { text: "いつも元気でムードメーカー", scores: { x: 0, y: 2 } },
      { text: "謎めいた雰囲気で虜にする存在", scores: { x: -1, y: -2 } },
    ],
  },
];

export const CHARACTER_TYPES: CharacterType[] = [
  // 4象限タイプ
  {
    id: "koakuma",
    name: "小悪魔キュート",
    description: "可愛さとアクティブさを武器に、お客様を翻弄する小悪魔タイプ。明るく甘え上手で、「もう、しょうがないな」と思わせる天才。",
    impression: "元気で可愛い、一緒にいると楽しい、ちょっと振り回される感じが癖になる",
    specialMove: "「えー、ダメ？」の上目遣いおねだり",
    quadrant: { x: "cute", y: "active" },
  },
  {
    id: "tennen",
    name: "天然癒し系",
    description: "柔らかな雰囲気とミステリアスな可愛さで、不思議と惹きつけられるタイプ。天然ボケも計算なのか天然なのか...そこが魅力。",
    impression: "ふわふわしてて癒される、守ってあげたくなる、不思議な魅力がある",
    specialMove: "無意識の沈黙とふんわり微笑み",
    quadrant: { x: "cute", y: "mysterious" },
  },
  {
    id: "coolbeauty",
    name: "クールビューティー",
    description: "クールでミステリアスな大人の魅力の持ち主。多くを語らず、でもその一言一言に重みがある。「もっと知りたい」と思わせるタイプ。",
    impression: "近寄りがたいけど惹かれる、大人っぽい、たまに見せる笑顔にドキッとする",
    specialMove: "ふとした瞬間に見せる本音のひとこと",
    quadrant: { x: "cool", y: "mysterious" },
  },
  {
    id: "dekiru",
    name: "デキる姐さん",
    description: "クールな見た目にアクティブな行動力。場を仕切りつつも楽しませる、頼れるお姉さん的存在。後輩からも慕われるカリスマ。",
    impression: "カッコいい、頼りになる、仕事ができそう、憧れの先輩感",
    specialMove: "「私に任せて」の頼もしい一言",
    quadrant: { x: "cool", y: "active" },
  },
  // 4極端タイプ
  {
    id: "idol",
    name: "アイドル系",
    description: "圧倒的なキュートさで全方位から愛される存在。笑顔が最大の武器で、まるでステージに立つアイドルのようなキラキラオーラ。",
    impression: "とにかく可愛い、キラキラしてる、推したくなる、応援したくなる",
    specialMove: "全力笑顔の「大好き！」",
    quadrant: "extreme",
  },
  {
    id: "sexy",
    name: "大人セクシー",
    description: "圧倒的なクールさで魅了する大人の色気の持ち主。その存在感だけで空気が変わる、まさにNo.1の風格。",
    impression: "色気がすごい、大人の魅力、ドキドキする、特別感がある",
    specialMove: "意味深な微笑みと視線",
    quadrant: "extreme",
  },
  {
    id: "partygirl",
    name: "パーティーガール",
    description: "超アクティブで場を盛り上げる天才。彼女がいれば絶対に楽しい夜になる。テンションの高さとノリの良さは唯一無二。",
    impression: "超楽しい、一緒にいると元気になる、ノリがいい、パワフル",
    specialMove: "「もう一杯いこう！」のテンション爆上げ",
    quadrant: "extreme",
  },
  {
    id: "mysteriousqueen",
    name: "ミステリアスクイーン",
    description: "超ミステリアスな雰囲気で「もっと知りたい」と思わせ続ける女王様タイプ。見せない部分があるからこそ、追いかけたくなる。",
    impression: "謎めいてる、気になって仕方ない、深そう、独特の世界観がある",
    specialMove: "「秘密...」の意味深な一言",
    quadrant: "extreme",
  },
];
