"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, Store } from "lucide-react";
import { useAppSession } from "@/lib/auth-helpers";
import { Spinner } from "@/components/ui/spinner";
import { MessageThread } from "@/components/messages/message-thread";
import { trpc } from "@/lib/trpc";

export default function CastMessageThreadPage() {
  const router = useRouter();
  const params = useParams<{ matchId: string }>();
  const matchId = params?.matchId;
  const { data: session, status } = useAppSession();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/c/login");
    else if (session && session.user.role !== "CAST") router.push("/c/login");
  }, [session, status, router]);

  const enabled = !!session && session.user.role === "CAST" && !!matchId;

  const { data: matchesData, isLoading } = trpc.match.getMatches.useQuery(
    { status: "ACCEPTED", limit: 50 },
    { enabled },
  );

  if (
    status === "loading" ||
    !session ||
    session.user.role !== "CAST" ||
    !matchId
  ) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  const match = matchesData?.matches.find((m) => m.id === matchId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="-m-4 flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-gray-500">
          このやりとりは見つからないか、アクセスできません。
        </p>
        <button
          type="button"
          onClick={() => router.push("/c/messages")}
          className="text-sm text-(--primary) underline"
        >
          一覧に戻る
        </button>
      </div>
    );
  }

  const avatarUrl = match.store.photos?.[0] ?? null;

  return (
    <div className="-m-4 flex h-[calc(100%+2rem)] flex-col bg-white">
      <header className="flex items-center gap-2 border-b border-gray-100 bg-white px-3 py-2.5">
        <button
          type="button"
          onClick={() => router.push("/c/messages")}
          aria-label="戻る"
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-100">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              fill
              className="object-cover"
              sizes="36px"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <Store className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold text-gray-900">
            {match.store.name}
          </span>
          {match.store.area && (
            <span className="truncate text-[11px] text-gray-400">
              {match.store.area}
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <MessageThread matchId={matchId} currentUserId={session.user.id} />
      </div>
    </div>
  );
}
