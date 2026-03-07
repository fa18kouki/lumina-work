export interface CompatibilityType {
  typeName: string;
  comment: string;
  minPercentage: number;
}

export const COMPATIBILITY_TYPES: CompatibilityType[] = [
  {
    typeName: "運命の二人",
    comment: "まるで前世から繋がっていたかのような奇跡的な相性！一緒にいるだけで心が満たされる特別な関係です。",
    minPercentage: 95,
  },
  {
    typeName: "最高のパートナー",
    comment: "お互いの良さを最大限に引き出し合える素晴らしい組み合わせ。自然体でいられる心地よさがあります。",
    minPercentage: 88,
  },
  {
    typeName: "息ぴったり",
    comment: "テンポが合って会話も弾む！笑いのツボも似ていて、一緒にいると時間があっという間に過ぎていきます。",
    minPercentage: 80,
  },
  {
    typeName: "気になる存在",
    comment: "お互いに惹かれるものがある関係。もっと知り合えば、さらに深い絆が生まれる予感がします。",
    minPercentage: 72,
  },
  {
    typeName: "これから伸びる関係",
    comment: "まだお互いの魅力を発見しきれていないだけ。会話を重ねるほどに相性がどんどん上がっていくタイプです！",
    minPercentage: 65,
  },
  {
    typeName: "ミステリアスな縁",
    comment: "不思議な引力で結ばれた二人。真逆に見えて実は補い合える、意外性のある組み合わせです。",
    minPercentage: 0,
  },
];

export const DETAIL_LABELS = ["会話の相性", "笑いの相性", "フィーリング"] as const;
