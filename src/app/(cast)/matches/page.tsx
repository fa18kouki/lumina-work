"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppSession } from "@/lib/auth-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Thumbnail } from "@/components/ui/thumbnail";
import { trpc } from "@/lib/trpc";
import { Heart, MapPin, MessageCircle } from "lucide-react";

export default function MatchesPage() {
  const router = useRouter();
  const { data: session, status } = useAppSession();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (session && session.user.role !== "CAST") router.push("/login");
  }, [session, status, router]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.match.getMatches.useInfiniteQuery(
      { status: "ACCEPTED", limit: 10 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

  const matches = data?.pages.flatMap((page) => page.matches) ?? [];

  if (status === "loading" || !session || session.user.role !== "CAST") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-(--text-main)">やりとり中</h1>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : matches.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Heart}
              title="やりとり中の店舗はありません"
              action={{ label: "オファーを確認する", href: "/offers" }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <Card key={match.id}>
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <Thumbnail
                    src={match.store.photos?.[0]}
                    alt={match.store.name}
                    fallbackType="store"
                  />

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-(--text-main)">{match.store.name}</h3>
                    <p className="text-sm text-(--text-sub) flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {match.store.area}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      やりとり開始: {new Date(match.createdAt).toLocaleDateString("ja-JP")}
                    </p>
                  </div>

                  <Link href={`/chat/${match.id}`}>
                    <Button size="sm">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      チャット
                    </Button>
                  </Link>
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
