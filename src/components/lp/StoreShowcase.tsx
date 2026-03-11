import Link from "next/link";
import { SectionHeader } from "./SectionHeader";
import { GradientButton } from "./GradientButton";

function MapPinIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function CurrencyYenIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8l3 5m0 0l3-5m-3 5v4m-3-5h6m-6 3h6m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

const stores = [
  {
    id: 1,
    name: "Club Elegant",
    badge: "未経験歓迎",
    location: "銀座",
    salary: "時給 3,500円〜",
    image: "https://placehold.co/240x192/fce7f3/f472b6?text=Club+Elegant",
  },
  {
    id: 2,
    name: "Lounge Royal",
    badge: "高時給",
    location: "六本木",
    salary: "時給 4,000円〜",
    image: "https://placehold.co/240x192/fce7f3/f472b6?text=Lounge+Royal",
  },
  {
    id: 3,
    name: "Bar Luxe",
    badge: "駅チカ",
    location: "新宿",
    salary: "時給 3,000円〜",
    image: "https://placehold.co/240x192/fce7f3/f472b6?text=Bar+Luxe",
  },
  {
    id: 4,
    name: "Night Garden",
    badge: "週1OK",
    location: "渋谷",
    salary: "時給 3,800円〜",
    image: "https://placehold.co/240x192/fce7f3/f472b6?text=Night+Garden",
  },
];

export function StoreShowcase() {
  return (
    <section className="bg-gradient-to-b from-white to-pink-50 py-20 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader
          tag="Pick up Lifestyle"
          title="人気の店舗"
          subtitle="厳選された優良店舗をご紹介"
        />

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stores.map((store) => (
            <div
              key={store.id}
              className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
            >
              {/* Image */}
              <div className="relative h-48">
                <img
                  src={store.image}
                  alt={store.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 bg-pink-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {store.badge}
                </span>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {store.name}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPinIcon />
                    <span>{store.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CurrencyYenIcon />
                    <span>{store.salary}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <GradientButton href="/c/login">
            もっと見る
          </GradientButton>
        </div>
      </div>
    </section>
  );
}
