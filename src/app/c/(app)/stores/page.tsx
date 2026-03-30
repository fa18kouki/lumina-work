"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSession } from "@/lib/auth-helpers";
import { Search, SlidersHorizontal } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { trpc } from "@/lib/trpc";
import { TagFilter } from "@/components/cast/TagFilter";
import { StoreCard } from "@/components/cast/StoreCard";

const FILTER_TAGS = [
  "すべて",
  "未経験歓迎",
  "日払いOK",
  "ドレス貸与",
  "送りあり",
  "高時給",
  "ノルマなし",
];

function formatSalary(salarySystem: unknown): string {
  if (!salarySystem) return "応相談";
  if (typeof salarySystem === "string") return salarySystem;
  const sys = salarySystem as Record<string, number>;
  if (sys.hourlyRateMin) {
    return `時給 ${sys.hourlyRateMin.toLocaleString()}円〜`;
  }
  return "応相談";
}

export default function StoresPage() {
  const router = useRouter();
  const { data: session, status } = useAppSession();
  const [selectedTag, setSelectedTag] = useState("すべて");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (status === "unauthenticated" || (session && session.user.role !== "CAST")) {
      if (status === "unauthenticated") router.push("/c/login");
      else if (session?.user.role !== "CAST") router.push("/c/login");
    }
  }, [session, status, router]);

  const { data: storesData, isLoading } = trpc.cast.searchStores.useQuery({
    area: debouncedQuery || undefined,
  });
  const allStores = storesData?.stores ?? [];

  const filteredStores = allStores.filter((store) => {
    if (selectedTag === "すべて") return true;
    const benefits = (store.benefits as string[] | null) ?? [];
    return benefits.some((b) => b.includes(selectedTag.replace("OK", "").replace("あり", "")));
  });

  if (status === "loading" || isLoading || !session || session.user.role !== "CAST") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 bg-(--bg-gray) pt-2 pb-3 -mx-4 px-4 z-10">
        <div className="flex gap-2.5 mb-4">
          <div className="flex-1 bg-gray-100 rounded-xl px-4 py-3 flex items-center gap-2.5">
            <Search className="w-5 h-5 text-(--text-sub)" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="エリア、キーワードで検索..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-(--text-sub)"
            />
          </div>
          <button className="w-12 h-12 bg-(--primary-bg) rounded-xl flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5 text-(--primary)" />
          </button>
        </div>

        <TagFilter
          tags={FILTER_TAGS}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
        />
      </div>

      <div className="space-y-4 pb-4">
        {filteredStores.length === 0 ? (
          <EmptyState icon={Search} title="該当する店舗が見つかりませんでした" />
        ) : (
          filteredStores.map((store) => (
            <StoreCard
              key={store.id}
              id={store.id}
              name={store.name}
              area={store.area ?? ""}
              salary={formatSalary(store.salarySystem)}
              imageUrl={(store.photos as string[] | null)?.[0] ?? "/service-scene-05.png"}
              tags={(store.benefits as string[] | null) ?? []}
              variant="horizontal"
            />
          ))
        )}
      </div>
    </div>
  );
}
