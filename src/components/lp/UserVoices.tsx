"use client";

function QuoteIcon() {
  return (
    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
    </svg>
  );
}

const voices = [
  {
    id: 1,
    name: "Aさん",
    age: "21歳",
    occupation: "大学生",
    comment:
      "学業と両立しながら働けています！匿名で相談できたので、不安なく始められました。",
  },
  {
    id: 2,
    name: "Mさん",
    age: "23歳",
    occupation: "フリーター",
    comment:
      "未経験でしたが、優良店を紹介してもらえて安心です。スタッフの方も親切でした。",
  },
  {
    id: 3,
    name: "Yさん",
    age: "20歳",
    occupation: "大学生",
    comment:
      "診断で自分に合うお店が見つかりました。自分のペースで働けるので続けやすいです！",
  },
];

export function UserVoices() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="text-center mb-10">
          <span className="text-sm tracking-widest uppercase text-gray-400">
            VOICES
          </span>
          <h2 className="text-2xl md:text-3xl font-bold mt-2 text-gray-900">
            利用者の声
          </h2>
          <p className="text-sm mt-2 text-gray-500">
            実際にご利用いただいた方々のリアルな声
          </p>
        </div>

        {/* カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {voices.map((voice) => (
            <div
              key={voice.id}
              className="rounded-2xl p-6 border bg-pink-50 border-pink-100"
            >
              {/* アイコン */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4 bg-pink-500">
                <QuoteIcon />
              </div>

              {/* コメント */}
              <p className="text-sm leading-relaxed mb-4 text-gray-600">
                {voice.comment}
              </p>

              {/* プロフィール */}
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">
                  {voice.name}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-pink-100 text-pink-600">
                  {voice.age}
                </span>
                <span className="text-xs text-gray-400">
                  {voice.occupation}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
