"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, User } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { MessageThread } from "@/components/messages/message-thread";

export default function OwnerMessageThreadPage() {
  const router = useRouter();
  const params = useParams<{ matchId: string }>();
  const matchId = params?.matchId;

  const { data: matchesData, isLoading: isLoadingMatches } =
    trpc.match.getMatches.useQuery(
      { status: "ACCEPTED", limit: 50 },
      { enabled: !!matchId },
    );
  const { data: ownerProfile, isLoading: isLoadingProfile } =
    trpc.owner.getProfile.useQuery();

  const match = matchesData?.matches.find((m) => m.id === matchId);
  const currentUserId = ownerProfile?.userId ?? null;

  if (!matchId) {
    return null;
  }

  if (isLoadingMatches || isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-[var(--text-sub)]">
        読み込み中...
      </div>
    );
  }

  if (!match || !currentUserId) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="text-sm text-[var(--text-sub)]">
          このやりとりは見つからないか、アクセスできません。
        </p>
        <button
          type="button"
          onClick={() => router.push("/o/messages")}
          className="text-sm text-slate-700 underline"
        >
          一覧に戻る
        </button>
      </div>
    );
  }

  const avatarUrl = match.cast.photos?.[0] ?? null;

  return (
    <div className="-m-6 md:-m-10 flex h-[calc(100vh-70px)] flex-col bg-white">
      <header className="flex items-center gap-2 border-b border-gray-100 bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => router.push("/o/messages")}
          aria-label="戻る"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-sub)] hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              fill
              className="object-cover"
              sizes="40px"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <User className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold text-[var(--text-main)]">
            {match.cast.nickname ?? "キャスト"}
          </span>
          <span className="truncate text-[11px] text-[var(--text-sub)]">
            {match.store.name}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <MessageThread matchId={matchId} currentUserId={currentUserId} />
      </div>
    </div>
  );
}
