"use client";

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "面接画面・情報登録",
      subtitle: "SNSアカウント登録",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
    },
    {
      number: "02",
      title: "チャットボット・AIボイス",
      subtitle: null,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      number: "03",
      title: "診断結果",
      subtitle: null,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      number: "04",
      title: "お店を探す・オファーを待つ",
      subtitle: null,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      number: "05",
      title: "条件に合うお店やオファーが届きます",
      subtitle: null,
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-xl mx-auto px-4">
        {/* セクションヘッダー */}
        <div className="text-center mb-8">
          <span className="text-sm tracking-widest uppercase text-gray-400">
            HOW IT WORKS
          </span>
          <h2 className="mt-2 text-2xl md:text-3xl font-bold text-gray-900">
            ご利用の流れ
          </h2>
        </div>

        {/* 前提条件ボックス */}
        <div className="rounded-xl p-4 mb-8 border bg-pink-50/50 border-pink-100">
          <p className="text-sm font-semibold mb-2 text-pink-500">
            ご利用条件
          </p>
          <ul className="text-sm space-y-1 text-gray-600">
            <li>・18歳以上（高校生不可）</li>
            <li>・個人情報取得許諾</li>
          </ul>
        </div>

        {/* 縦型フローチャート */}
        <div className="relative">
          {/* 縦の接続線 */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-pink-100" />

          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={step.number} className="relative flex items-start gap-4">
                {/* アイコン */}
                <div className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-pink-100 text-pink-500 border border-pink-200">
                  {step.icon}
                </div>

                {/* コンテンツ */}
                <div className="flex-1 rounded-xl p-4 border bg-white border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-pink-500">
                      STEP {step.number}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {step.title}
                  </p>
                  {step.subtitle && (
                    <p className="text-sm mt-0.5 text-gray-500">
                      {step.subtitle}
                    </p>
                  )}
                </div>

                {/* 矢印（最後以外） */}
                {index < steps.length - 1 && (
                  <div className="absolute left-[22px] -bottom-4 z-10 text-pink-300">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 10l5 5 5-5z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 女の子の情報カード */}
        <div className="mt-10 rounded-xl p-5 border bg-gradient-to-br from-pink-50 to-white border-pink-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-pink-100 text-pink-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">
              女の子の情報
            </h3>
          </div>
          <p className="text-sm text-gray-600">
            以降あなたの条件に合うお店やアカウントに条件が通知されます。
            あなたのプロフィール情報をもとに、ぴったりのお店からオファーが届きます。
          </p>
        </div>
      </div>
    </section>
  );
}
