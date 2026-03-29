"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppSession } from "@/lib/auth-helpers";
import { ChevronLeft, EyeOff, MapPin } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { trpc } from "@/lib/trpc";

const DEFAULT_IMAGE = "/service-scene-10.png";

export default function BlockedStoresPage() {
  const router = useRouter();
  const { data: session, status } = useAppSession();

  useEffect(() => {
    if (status === "unauthenticated" || (session && session.user.role !== "CAST")) {
      if (status === "unauthenticated") router.push("/c/login");
      else if (session?.user.role !== "CAST") router.push("/c/login");
    }
  }, [session, status, router]);

  const { data, isLoading } = trpc.cast.getBlockedStores.useQuery({});
  const utils = trpc.useUtils();

  const unblockMutation = trpc.cast.unblockStore.useMutation({
    onSuccess: () => {
      utils.cast.getBlockedStores.invalidate();
    },
  });

  const handleUnblock = (storeId: string, storeName: string) => {
    if (window.confirm(`${storeName} のブロックを解除しますか？`)) {
      unblockMutation.mutate({ storeId });
    }
  };

  if (status === "loading" || isLoading || !session || session.user.role !== "CAST") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  const blocks = data?.blocks ?? [];

  return (
    <div className="space-y-4 pb-4">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-(--bg-sub) flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-(--text-sub)" />
        </button>
        <h1 className="text-xl font-bold text-(--text-main)">みちゃだめリスト</h1>
      </div>

      <p className="text-sm text-(--text-sub) px-1">
        ブロック中の店舗には、あなたのプロフィールが表示されません。
      </p>

      {blocks.length === 0 ? (
        <EmptyState
          icon={EyeOff}
          title="ブロックしている店舗はありません"
        />
      ) : (
        <div className="space-y-3">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="bg-white rounded-(--radius-card) shadow-(--shadow-card) p-4 flex items-center gap-4"
            >
              <Link
                href={`/c/stores/${block.store.id}`}
                className="shrink-0"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden">
                  <Image
                    src={block.store.photos[0] ?? DEFAULT_IMAGE}
                    alt={block.store.name}
                    width={56}
                    height={56}
                    className="object-cover w-full h-full"
                  />
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/c/stores/${block.store.id}`}>
                  <p className="font-semibold text-(--text-main) text-sm truncate">
                    {block.store.name}
                  </p>
                </Link>
                <div className="flex items-center gap-1 text-xs text-(--text-sub) mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span>{block.store.area}</span>
                </div>
              </div>
              <button
                onClick={() => handleUnblock(block.store.id, block.store.name)}
                disabled={unblockMutation.isPending}
                className="shrink-0 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-full hover:bg-red-100 transition-colors"
              >
                解除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
