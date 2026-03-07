// ==================== 共通型 ====================

type BasePayload = {
  /** InApp通知の送信先ユーザーID */
  recipientUserId: string;
};

// ==================== キャスト向け通知 ====================

/** #1 店舗→キャストにオファー送信 (実装済み) */
type OfferReceivedPayload = BasePayload & {
  offerId: string;
  castUserId: string;
  castLineUserId: string | null;
  castEmail: string | null;
  storeName: string;
  storeArea: string;
  offerMessage: string;
};

/** #4 面接日程確定（キャスト向け） */
type InterviewScheduledCastPayload = BasePayload & {
  interviewId: string;
  castLineUserId: string | null;
  castEmail: string | null;
  storeName: string;
  storeAddress: string;
  scheduledAt: string; // ISO8601
};

/** #5 面接キャンセル（キャスト向け） */
type InterviewCancelledCastPayload = BasePayload & {
  interviewId: string;
  castLineUserId: string | null;
  castEmail: string | null;
  storeName: string;
  scheduledAt: string;
};

/** #6 メッセージ受信（キャスト向け） */
type MessageReceivedCastPayload = BasePayload & {
  matchId: string;
  castLineUserId: string | null;
  castEmail: string | null;
  senderName: string;
  messagePreview: string;
};

/** #8 無断欠席報告 */
type NoShowReportedPayload = BasePayload & {
  interviewId: string;
  castLineUserId: string | null;
  castEmail: string | null;
  storeName: string;
  penaltyCount: number;
};

/** #10 面接完了 */
type InterviewCompletedPayload = BasePayload & {
  interviewId: string;
  castLineUserId: string | null;
  storeName: string;
};

/** #11 アカウント停止 */
type AccountSuspendedPayload = BasePayload & {
  castEmail: string | null;
};

// ==================== 店舗向け通知 ====================

/** #2 オファー承諾 */
type OfferAcceptedPayload = BasePayload & {
  offerId: string;
  storeEmail: string | null;
  castNickname: string;
};

/** #3 オファー辞退 */
type OfferRejectedPayload = BasePayload & {
  offerId: string;
  storeEmail: string | null;
  castNickname: string;
};

/** #4 面接日程確定（店舗向け） */
type InterviewScheduledStorePayload = BasePayload & {
  interviewId: string;
  storeEmail: string | null;
  castNickname: string;
  scheduledAt: string;
};

/** #5 面接キャンセル（店舗向け） */
type InterviewCancelledStorePayload = BasePayload & {
  interviewId: string;
  storeEmail: string | null;
  castNickname: string;
  scheduledAt: string;
};

/** #6 メッセージ受信（店舗向け） */
type MessageReceivedStorePayload = BasePayload & {
  matchId: string;
  storeEmail: string | null;
  senderName: string;
  messagePreview: string;
};

/** #9 オファー期限切れ */
type OfferExpiredPayload = BasePayload & {
  offerId: string;
  storeEmail: string | null;
  castNickname: string;
};

// ==================== Discriminated Union ====================

export type NotificationEvent =
  | { type: "OFFER_RECEIVED"; payload: OfferReceivedPayload }
  | { type: "OFFER_ACCEPTED"; payload: OfferAcceptedPayload }
  | { type: "OFFER_REJECTED"; payload: OfferRejectedPayload }
  | { type: "INTERVIEW_SCHEDULED_CAST"; payload: InterviewScheduledCastPayload }
  | { type: "INTERVIEW_SCHEDULED_STORE"; payload: InterviewScheduledStorePayload }
  | { type: "INTERVIEW_CANCELLED_CAST"; payload: InterviewCancelledCastPayload }
  | { type: "INTERVIEW_CANCELLED_STORE"; payload: InterviewCancelledStorePayload }
  | { type: "MESSAGE_RECEIVED_CAST"; payload: MessageReceivedCastPayload }
  | { type: "MESSAGE_RECEIVED_STORE"; payload: MessageReceivedStorePayload }
  | { type: "NO_SHOW_REPORTED"; payload: NoShowReportedPayload }
  | { type: "INTERVIEW_COMPLETED"; payload: InterviewCompletedPayload }
  | { type: "ACCOUNT_SUSPENDED"; payload: AccountSuspendedPayload }
  | { type: "OFFER_EXPIRED"; payload: OfferExpiredPayload };

/** Prisma NotificationType enum に対応する通知タイプ（InApp保存用） */
export type InAppNotificationType =
  | "OFFER_RECEIVED"
  | "OFFER_ACCEPTED"
  | "OFFER_REJECTED"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW_CANCELLED"
  | "MESSAGE_RECEIVED"
  | "NO_SHOW_REPORTED"
  | "INTERVIEW_COMPLETED"
  | "ACCOUNT_SUSPENDED"
  | "OFFER_EXPIRED";
