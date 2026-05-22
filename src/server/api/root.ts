import { createTRPCRouter, createCallerFactory } from "./trpc";
import { castRouter } from "./routers/cast";
import { storeRouter } from "./routers/store";
import { ownerRouter } from "./routers/owner";
import { ownerAuthRouter } from "./routers/owner-auth";
import { matchRouter } from "./routers/match";
import { interviewRouter } from "./routers/interview";
import { messageRouter } from "./routers/message";
import { adminRouter } from "./routers/admin";
import { adminPanelRouter } from "./routers/admin-panel";
import { diagnosisRouter } from "./routers/diagnosis";
import { notificationRouter } from "./routers/notification";
import { subscriptionRouter } from "./routers/subscription";
import { referralRouter } from "./routers/referral";
import { authRouter } from "./routers/auth";

/**
 * メインルーター
 */
export const appRouter = createTRPCRouter({
  cast: castRouter,
  store: storeRouter,
  owner: ownerRouter,
  ownerAuth: ownerAuthRouter,
  match: matchRouter,
  interview: interviewRouter,
  message: messageRouter,
  admin: adminRouter,
  adminPanel: adminPanelRouter,
  diagnosis: diagnosisRouter,
  notification: notificationRouter,
  subscription: subscriptionRouter,
  referral: referralRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;

/**
 * サーバーサイドでtRPCを呼び出すためのファクトリ
 */
export const createCaller = createCallerFactory(appRouter);
