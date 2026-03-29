/**
 * 安心・安全の訴求（Nomination 風レイアウト。記載は LUMINA の仕様に沿った範囲に限定）
 */
const items = [
  {
    title: "18歳以上の方のみ",
    body: "高校生の方はご利用いただけません。年齢確認のため、本人確認にご協力いただく場合があります。",
  },
  {
    title: "個人情報の保護",
    body: "暗号化通信の利用やアクセス管理など、個人情報の取り扱いに配慮した設計です。詳細はプライバシーポリシーをご確認ください。",
  },
  {
    title: "「みちゃだめ」でブロック",
    body: "見られたくない店舗をブロックすると、当該店舗側からあなたのプロフィールが閲覧されにくくなります。",
  },
  {
    title: "オファーはアプリ内で確認",
    body: "店舗から届く採用オファーの内容は、アプリ上で確認のうえ、承諾・辞退を選べます。",
  },
];

export function TrustAndSafety() {
  return (
    <section className="border-t border-pink-100 bg-pink-50/40 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-pink-500">安心・安全への取り組み</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-900 md:text-4xl">
            はじめての方も、安心してお店探しから
          </h2>
          <p className="mt-3 text-sm text-stone-600 md:text-base">
            サービス利用にあたって、大切にしていることをまとめました。
          </p>
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:gap-6">
          {items.map((item) => (
            <li
              key={item.title}
              className="flex gap-4 rounded-2xl border border-white bg-white/90 p-5 shadow-sm md:p-6"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-500 text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <div>
                <h3 className="font-bold text-stone-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
