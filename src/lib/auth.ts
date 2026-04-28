import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { AdapterUser } from "@auth/core/adapters";
import Line from "next-auth/providers/line";
import Twitter from "next-auth/providers/twitter";
import Nodemailer from "next-auth/providers/nodemailer";
import { prisma } from "@/server/db";
import type { UserRole } from "@prisma/client";
import { buildVerificationEmail } from "@/lib/auth-email-template";

// Prisma 7 + PrismaPg 使用時、API ルートで account の findUnique/findFirst が
// Invalid invocation になるため、getUserByAccount / unlinkAccount のみ $queryRaw / $executeRaw で実装
function createAuthAdapter() {
  const base = PrismaAdapter(prisma);
  return {
    ...base,
    async createUser({ id: _id, name: _name, ...data }: AdapterUser) {
      const user = await prisma.user.create({ data });

      // CAST ロールのユーザーには空の Cast レコードを自動作成
      // LINE/Twitter/Email どの認証経路でも Cast の存在を保証する。
      // nickname/age/isAvailableNow は本人が診断 or 編集画面で入れるまで未設定(空/null/false)。
      if (user.role === "CAST") {
        await prisma.cast.create({
          data: {
            userId: user.id,
            nickname: "",
            photos: [],
            desiredAreas: [],
            preferredAtmosphere: [],
            preferredClientele: [],
          },
        });
      }

      return { ...user, name: null } as AdapterUser;
    },
    async getUserByAccount(provider_providerAccountId: {
      provider: string;
      providerAccountId: string;
    }): Promise<AdapterUser | null> {
      const rows = await prisma.$queryRaw<
        Array<{
          id: string;
          email: string | null;
          email_verified: Date | null;
          image: string | null;
          role: string;
        }>
      >`
        SELECT u.id, u.email, u.email_verified, u.image, u.role
        FROM accounts a
        JOIN users u ON u.id = a.user_id
        WHERE a.provider = ${provider_providerAccountId.provider}
          AND a.provider_account_id = ${provider_providerAccountId.providerAccountId}
        LIMIT 1
      `;
      const row = rows[0];
      if (!row) return null;
      return {
        id: row.id,
        email: row.email,
        emailVerified: row.email_verified,
        name: null,
        image: row.image,
        role: row.role as UserRole,
      } as AdapterUser;
    },
    async unlinkAccount(provider_providerAccountId: {
      provider: string;
      providerAccountId: string;
    }): Promise<void> {
      await prisma.$executeRaw`
        DELETE FROM accounts
        WHERE provider = ${provider_providerAccountId.provider}
          AND provider_account_id = ${provider_providerAccountId.providerAccountId}
      `;
    },
  };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: createAuthAdapter(),
  providers: [
    Line({
      clientId: process.env.AUTH_LINE_ID,
      clientSecret: process.env.AUTH_LINE_SECRET,
    }),
    Twitter({
      clientId: process.env.AUTH_TWITTER_ID,
      clientSecret: process.env.AUTH_TWITTER_SECRET,
    }),
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT) || 587,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        const nodemailer = (await import("nodemailer")).default;
        const transport = nodemailer.createTransport(provider.server);
        const { host } = new URL(url);
        const { subject, html, text } = buildVerificationEmail({ url, host });
        const result = await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject,
          text,
          html,
        });
        const failed = (result?.rejected ?? [])
          .concat(result?.pending ?? [])
          .filter(Boolean);
        if (failed.length > 0) {
          throw new Error(
            `Email(s) (${failed.join(", ")}) could not be sent`
          );
        }
      },
    }),
  ],
  callbacks: {
    signIn: async ({ user, account }) => {
      // LINEログイン時、providerAccountId を Cast.lineUserId に同期
      if (account?.provider === "line" && user.id) {
        try {
          await prisma.cast.updateMany({
            where: { userId: user.id, lineUserId: null },
            data: { lineUserId: account.providerAccountId },
          });
        } catch (e) {
          // Cast未作成の場合はスキップ（プロフィール作成時に再同期）
          console.warn("[AUTH] Failed to sync lineUserId on signIn:", e);
        }
      }
      return true;
    },
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
        role: (user as unknown as { role: UserRole }).role,
      },
    }),
  },
  pages: {
    // NextAuth は CAST 専用 (LINE / Twitter / メールOTP)
    // OWNER は Supabase Auth を使用するため、このページ設定は CAST にのみ影響する。
    // error はデフォルト (/api/auth/error) のままにする。
    // 誤って OWNER が NextAuth エラーを踏んだ場合に /c/login へ飛ばないようにする。
    signIn: "/c/login",
  },
});

// NextAuth用の型定義
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role: UserRole;
    };
  }
}
