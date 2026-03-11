"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSession } from "@/lib/auth-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { TabFilter } from "@/components/ui/tab-filter";
import { EmptyState } from "@/components/ui/empty-state";
import { Thumbnail } from "@/components/ui/thumbnail";
import { trpc } from "@/lib/trpc";
import { ChevronRight, Mail } from "lucide-react";

type OfferStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";

const STATUS_TABS = [
  { value: "ALL", label: "すべて" },
  { value: "PENDING", label: "未回答" },
  { value: "ACCEPTED", label: "承諾済" },
  { value: "REJECTED", label: "辞退済" },
];

export default function OffersPage() {
  const router = useRouter();
  const { data: session, status } = useAppSession();
  const [statusFilter, setStatusFilter] = useState<OfferStatus | "ALL">("ALL");
  const utils = trpc.useUtils();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/c/login");
    else if (session && session.user.role !== "CAST") router.push("/c/login");
  }, [session, status, router]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.cast.getOffers.useInfiniteQuery(
      {
        status: statusFilter === "ALL" ? undefined : statusFilter,
        limit: 10,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

  const respondToOffer = trpc.cast.respondToOffer.useMutation({
    onSuccess: () => {
      utils.cast.getOffers.invalidate();
      utils.match.getMatches.invalidate();
    },
  });

  const offers = data?.pages.flatMap((page) => page.offers) ?? [];

  const handleRespond = (offerId: string, accept: boolean) => {
    if (confirm(accept ? "このオファーを承諾しますか？" : "このオファーを辞退しますか？")) {
      respondToOffer.mutate({ offerId, accept });
    }
  };

  if (status === "loading" || !session || session.user.role !== "CAST") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-(--text-main)">オファー</h1>

      <TabFilter
        tabs={STATUS_TABS}
        activeValue={statusFilter}
        onChange={(v) => setStatusFilter(v as OfferStatus | "ALL")}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : offers.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState icon={Mail} title="オファーはありません" />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <Card
              key={offer.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/c/offers/${offer.id}`)}
            >
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                  <Thumbnail
                    src={offer.store.photos?.[0]}
                    alt={offer.store.name}
                    fallbackType="store"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-(--text-main)">{offer.store.name}</h3>
                        <p className="text-sm text-(--text-sub)">{offer.store.area}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={offer.status} variant="offer" />
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {offer.message}
                    </p>

                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(offer.createdAt).toLocaleDateString("ja-JP")}
                    </p>

                    {offer.status === "PENDING" && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRespond(offer.id, true);
                          }}
                          isLoading={respondToOffer.isPending}
                        >
                          承諾する
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRespond(offer.id, false);
                          }}
                          isLoading={respondToOffer.isPending}
                        >
                          辞退する
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {hasNextPage && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                isLoading={isFetchingNextPage}
              >
                もっと見る
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
