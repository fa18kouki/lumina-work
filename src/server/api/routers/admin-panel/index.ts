import { createTRPCRouter } from "@/server/api/trpc";

import { adminInviteRouter } from "./invite";
import { adminOffersPanelRouter } from "./offers";
import { adminStoresPanelRouter } from "./stores";
import { adminUsersPanelRouter } from "./users";

/**
 * 管理画面 (admin.<host>) 専用ルーター。
 * 既存の `adminRouter` (Supabase Auth の ADMIN role 用) とは別のレイヤー。
 */
export const adminPanelRouter = createTRPCRouter({
  invite: adminInviteRouter,
  users: adminUsersPanelRouter,
  offers: adminOffersPanelRouter,
  stores: adminStoresPanelRouter,
});
