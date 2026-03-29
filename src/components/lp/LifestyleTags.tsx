/**
 * 働き方タグ（Nomination の Work&Lifestyle 風。掲載例としての訴求）
 */
const tags = [
  "日払いOK",
  "未経験歓迎",
  "週1〜OK",
  "Wワーク可",
  "送迎あり",
  "ノルマなし",
  "シフト相談OK",
];

export function LifestyleTags() {
  return (
    <section className="border-t border-stone-100 bg-white py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-sm font-semibold text-pink-500">Work &amp; Lifestyle</p>
          <h2 className="mt-2 text-xl font-bold text-stone-900 md:text-2xl">
            ライフスタイルに合わせた働き方のヒント
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            店舗によって条件は異なります。検索やオファーで自分に合う条件を見つけましょう。
          </p>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-2 md:gap-3">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-pink-100 bg-pink-50/80 px-4 py-2 text-sm font-medium text-pink-800"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
