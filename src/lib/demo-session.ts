"use client";

import { createContext, useContext } from "react";
import { useSession as useNextAuthSession } from "next-auth/react";
import type { UserRole } from "@prisma/client";

export type DemoRole = "CAST" | "OWNER";

export interface DemoUser {
  id: string;
  email: string;
  name: string;
  role: DemoRole;
}

export interface DemoSession {
  user: DemoUser;
  expires: string;
}

// セッションキー
const SESSION_KEY = "demo_session";
const DEMO_COOKIE_KEY = "demo_session_token";

// ランダムID生成
export function generateDemoUserId(): string {
  return `demo_${Math.random().toString(36).substring(2, 15)}`;
}

// デモセッション作成
export function createDemoSession(role: DemoRole): DemoSession {
  const userId = generateDemoUserId();
  const session: DemoSession = {
    user: {
      id: userId,
      email: `${userId}@demo.local`,
      name: role === "CAST" ? "デモキャスト" : "デモオーナー",
      role,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    // ミドルウェアで認識できるようにcookieも設定
    document.cookie = `${DEMO_COOKIE_KEY}=${role}; path=/; max-age=86400; SameSite=Lax`;
  }

  return session;
}

// デモセッション取得
export function getDemoSession(): DemoSession | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;

  try {
    const session = JSON.parse(stored) as DemoSession;
    // 有効期限チェック
    if (new Date(session.expires) < new Date()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

// デモセッションクリア
export function clearDemoSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
    document.cookie = `${DEMO_COOKIE_KEY}=; path=/; max-age=0`;
  }
}

// Context
interface DemoSessionContextType {
  session: DemoSession | null;
  login: (role: DemoRole) => void;
  logout: () => void;
}

export const DemoSessionContext = createContext<DemoSessionContextType>({
  session: null,
  login: () => {},
  logout: () => {},
});

export const useDemoSession = () => useContext(DemoSessionContext);

// NextAuth形式のセッションを返すカスタムフック
// デモセッションがあればそれを優先、なければNextAuthセッションを使用
export function useAppSession() {
  const { data: nextAuthSession, status: nextAuthStatus } = useNextAuthSession();
  const demoContext = useContext(DemoSessionContext);
  const demoSession = demoContext.session;

  // デモセッションがある場合はそれを優先
  if (demoSession) {
    return {
      data: {
        user: {
          id: demoSession.user.id,
          email: demoSession.user.email,
          name: demoSession.user.name,
          image: null,
          role: demoSession.user.role as UserRole,
        },
        expires: demoSession.expires,
      },
      status: "authenticated" as const,
    };
  }

  // NextAuthセッションを使用
  return {
    data: nextAuthSession,
    status: nextAuthStatus,
  };
}
