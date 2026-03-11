"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppSession } from "@/lib/auth-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc";
import { SalaryDisplay } from "@/components/store/salary-display";
import {
  ChevronLeft,
  MapPin,
  Clock,
  DollarSign,
  Gift,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Phone,
  Mail,
  ExternalLink,
} from "lucide-react";

export default function OfferDetailPage() {
  const router = useRouter();
  const params = useParams();
  const offerId = params.offerId as string;
  const { data: session, status } = useAppSession();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (session && session.user.role !== "CAST") router.push("/login");
  }, [session, status, router]);

  const { data: offer, isLoading, error } = trpc.cast.getOfferDetail.useQuery(
    { offerId },
    { enabled: !!session && session.user.role === "CAST" }
  );

  const respondToOffer = trpc.cast.respondToOffer.useMutation({
    onSuccess: () => {
      utils.cast.getOfferDetail.invalidate({ offerId });
      utils.cast.getOffers.invalidate();
      utils.match.getMatches.invalidate();
    },
  });

  const handleRespond = (accept: boolean) => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.push("/offers")}
          className="flex items-center gap-1 text-(--text-sub) hover:text-(--text-main)"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">オファー一覧</span>
        </button>
        <div className="text-center py-12">
          <p className="text-(--text-sub)">オファーが見つかりません</p>
        </div>
      </div>
    );
  }

  const isExpired =
    offer.status === "EXPIRED" ||
    (offer.status === "PENDING" && new Date(offer.expiresAt) < new Date());
  const canRespond = offer.status === "PENDING" && !isExpired;
  const daysUntilExpiry = Math.ceil(
    (new Date(offer.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const isExpiringSoon = canRespond && daysUntilExpiry <= 3;

  const getStatusInfo = () => {
    if (isExpired) return { label: "期限切れ", className: "bg-red-50 text-red-700 border-red-200", icon: XCircle };
    if (offer.status === "ACCEPTED") return { label: "承諾済み", className: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 };
    if (offer.status === "REJECTED") return { label: "辞退済み", className: "bg-gray-50 text-gray-700 border-gray-200", icon: XCircle };
    return { label: "未回答", className: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: CalendarDays };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6 pb-28">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/offers")}
          className="flex items-center gap-1 text-(--text-sub) hover:text-(--text-main)"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">オファー一覧</span>
        </button>
      </div>

      {offer.store.photos && offer.store.photos.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {offer.store.photos.map((photo: string, index: number) => (
            <div
              key={index}
              className="w-64 h-40 bg-gray-200 rounded-xl flex-shrink-0 overflow-hidden"
            >
              <img
                src={photo}
                alt={`${offer.store.name} ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-(--text-main)">{offer.store.name}</h1>
          {offer.store.isVerified && (
            <ShieldCheck className="w-5 h-5 text-(--primary)" />
          )}
        </div>
        <div className="flex items-center gap-1.5 text-(--text-sub) text-sm">
          <MapPin className="w-4 h-4" />
          <span>{offer.store.area}</span>
          {offer.store.address && (
            <span className="text-gray-400">・{offer.store.address}</span>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="py-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-(--text-main) pl-2.5 border-l-4 border-(--primary)">
              オファーメッセージ
            </h2>
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.className}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusInfo.label}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
            {offer.message}
          </p>

          {isExpiringSoon && (
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
              <span className="text-sm text-yellow-700">
                有効期限まであと{daysUntilExpiry}日です
              </span>
            </div>
          )}

          {isExpired && offer.status === "PENDING" && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span className="text-sm text-red-700">
                このオファーの有効期限は切れています
              </span>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-400 pt-1">
            <span>受信日: {new Date(offer.createdAt).toLocaleDateString("ja-JP")}</span>
            <span>有効期限: {new Date(offer.expiresAt).toLocaleDateString("ja-JP")}</span>
          </div>
        </CardContent>
      </Card>

      {offer.status === "ACCEPTED" && (offer.store.contactPhone || offer.store.contactEmail || offer.store.lineUrl) && (
        <Card>
          <CardContent className="py-5 space-y-4">
            <h2 className="text-base font-bold text-(--text-main) pl-2.5 border-l-4 border-(--primary)">
              店舗連絡先
            </h2>
            {offer.store.preferredContactMethod && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-(--primary-bg) text-(--primary)">
                推奨: {offer.store.preferredContactMethod === "PHONE" ? "電話" : offer.store.preferredContactMethod === "LINE" ? "LINE" : "メール"}
              </span>
            )}
            <div className="space-y-3">
              {offer.store.contactPhone && (
                <a
                  href={`tel:${offer.store.contactPhone}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Phone className="w-4 h-4 text-(--primary) flex-shrink-0" />
                  <span className="text-sm text-(--text-main)">{offer.store.contactPhone}</span>
                </a>
              )}
              {offer.store.contactEmail && (
                <a
                  href={`mailto:${offer.store.contactEmail}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Mail className="w-4 h-4 text-(--primary) flex-shrink-0" />
                  <span className="text-sm text-(--text-main)">{offer.store.contactEmail}</span>
                </a>
              )}
              {offer.store.lineUrl && (
                <a
                  href={offer.store.lineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-(--primary) flex-shrink-0" />
                  <span className="text-sm text-(--text-main)">LINE公式アカウント</span>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-5">
        {offer.store.description && (
          <section>
            <h2 className="text-base font-bold text-(--text-main) mb-3 pl-2.5 border-l-4 border-(--primary)">
              お店の特徴
            </h2>
            <p className="text-sm leading-relaxed text-(--text-sub)">
              {offer.store.description}
            </p>
          </section>
        )}

        {offer.store.businessHours && (
          <section>
            <h2 className="text-base font-bold text-(--text-main) mb-3 pl-2.5 border-l-4 border-(--primary)">
              営業時間
            </h2>
            <div className="flex items-center gap-2 text-sm text-(--text-main)">
              <Clock className="w-4 h-4 text-(--primary)" />
              <span>{offer.store.businessHours}</span>
            </div>
          </section>
        )}

        {offer.store.salarySystem && (
          <section>
            <h2 className="text-base font-bold text-(--text-main) mb-3 pl-2.5 border-l-4 border-(--primary)">
              給与体系
            </h2>
            <SalaryDisplay data={offer.store.salarySystem as Record<string, number>} />
          </section>
        )}

        {offer.store.benefits && offer.store.benefits.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-(--text-main) mb-3 pl-2.5 border-l-4 border-(--primary)">
              待遇・福利厚生
            </h2>
            <ul className="space-y-2">
              {offer.store.benefits.map((benefit: string, index: number) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-sm text-(--text-main)"
                >
                  <Gift className="w-4 h-4 text-(--primary) flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {canRespond && (
        <div className="fixed bottom-20 md:bottom-0 left-0 right-0 bg-white px-4 sm:px-6 py-3 sm:py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex gap-3 z-40">
          <Button
            variant="outline"
            onClick={() => handleRespond(false)}
            isLoading={respondToOffer.isPending}
            className="flex-1 h-12"
          >
            辞退する
          </Button>
          <Button
            onClick={() => handleRespond(true)}
            isLoading={respondToOffer.isPending}
            className="flex-1 h-12"
          >
            承諾する
          </Button>
        </div>
      )}

      {offer.status === "ACCEPTED" && (
        <div className="fixed bottom-20 md:bottom-0 left-0 right-0 bg-green-50 px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40">
          <div className="flex items-center justify-center gap-2 text-green-700 font-medium">
            <CheckCircle2 className="w-5 h-5" />
            <span>承諾済み — 上記の連絡先から店舗にご連絡ください</span>
          </div>
        </div>
      )}

      {offer.status === "REJECTED" && (
        <div className="fixed bottom-20 md:bottom-0 left-0 right-0 bg-gray-50 px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40">
          <div className="flex items-center justify-center gap-2 text-gray-600 font-medium">
            <XCircle className="w-5 h-5" />
            <span>このオファーを辞退しました</span>
          </div>
        </div>
      )}
    </div>
  );
}
