"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSession } from "@/lib/auth-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { MatchListItem } from "@/components/messages/match-list-item";
import { trpc } from "@/lib/trpc";
import { MessageCircle } from "lucide-react";

export default function CastMessagesPage() {
  const router = useRouter();
  const { data: session, status } = useAppSession();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/c/login");
    else if (session && session.user.role !== "CAST") router.push("/c/login");
  }, [session, status, router]);

  const { data, isLoading } = trpc.match.getMatches.useQuery(
    { status: "ACCEPTED", limit: 50 },
    {
      enabled: !!session && session.user.role === "CAST",
      refetchInterval: 30_000,
    },
  );

  if (status === "loading" || !session || session.user.role !== "CAST") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  const matches = data?.matches ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-(--text-main)">メッセージ</h1>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : matches.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={MessageCircle}
              title="まだやりとりはありません"
              description="オファーを承諾するとお店とメッセージできます。"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="-mx-4 overflow-hidden border-y border-gray-100 bg-white">
          {matches.map((match) => (
            <MatchListItem
              key={match.id}
              href={`/c/messages/${match.id}`}
              name={match.store.name}
              subText={match.store.area ?? null}
              avatarUrl={match.store.photos?.[0] ?? null}
              updatedAt={match.updatedAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
