"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAppSession } from "@/lib/auth-helpers";
import { Store, Bell, UserCircle, User, EyeOff } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc";
import { QuickActionCard } from "@/components/cast/QuickActionCard";
import { StoreCard } from "@/components/cast/StoreCard";

function formatSalary(salarySystem: unknown): string {
  if (!salarySystem) return "応相談";
  if (typeof salarySystem === "string") return salarySystem;
  const sys = salarySystem as Record<string, number>;
  if (sys.hourlyRateMin) {
    return `時給 ${sys.hourlyRateMin.toLocaleString()}円〜`;
  }
  return "応相談";
}

export default function CastDashboard() {
  const router = useRouter();
  const { data: session, status } = useAppSession();

  useEffect(() => {
    if (status === "unauthenticated" || (session && session.user.role !== "CAST")) {
      if (status === "unauthenticated") router.push("/c/login");
      else if (session?.user.role !== "CAST") router.push("/c/login");
    }
  }, [session, status, router]);

  const { data: profile, isLoading: profileLoading } = trpc.cast.getProfile.useQuery();
  const { data: storesData, isLoading: storesLoading } = trpc.cast.searchStores.useQuery({ limit: 4 });
  const recommendedStores = storesData?.stores ?? [];

  if (status === "loading" || profileLoading || !session || session.user.role !== "CAST") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-sm text-(--text-sub)">今日も頑張ろう！</p>
          <h1 className="text-2xl font-bold text-(--text-main)">
            こんにちは、{session.user.name || profile?.nickname || "ゲスト"}さん
          </h1>
        </div>
        <div className="relative">
          <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-(--primary)">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt="プロフィール"
                width={44}
                height={44}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-(--bg-sub) flex items-center justify-center">
                <User className="w-6 h-6 text-(--text-sub)" />
              </div>
            )}
          </div>
          {/* オンラインインジケーター */}
          <div className="absolute top-0 right-0 w-3 h-3 bg-(--primary) rounded-full border-2 border-white" />
        </div>
      </div>

      {/* クイックアクション */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <QuickActionCard
          href="/c/stores"
          label="店舗検索"
          icon={Store}
          variant="blue"
        />
        <QuickActionCard
          href="/c/offers"
          label="オファー"
          icon={Bell}
          variant="pink"
        />
        <QuickActionCard
          href="/c/profile/edit"
          label="マイページ"
          icon={UserCircle}
          variant="purple"
        />
        <QuickActionCard
          href="/c/blocked-stores"
          label="みちゃだめ"
          icon={EyeOff}
          variant="gray"
        />
      </div>

      {/* おすすめ店舗 */}
      <section>
        <h2 className="text-lg font-bold text-(--text-main) mb-4 px-1">
          あなたにおすすめ
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          {recommendedStores.map((store) => (
            <StoreCard
              key={store.id}
              id={store.id}
              name={store.name}
              area={store.area ?? ""}
              salary={formatSalary(store.salarySystem)}
              imageUrl={(store.photos as string[] | null)?.[0] ?? "/service-scene-01.png"}
              variant="vertical"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
