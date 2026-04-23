import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrismaUserCreate = vi.fn();
const mockPrismaCastCreate = vi.fn();

vi.mock("@/server/db", () => ({
  prisma: {
    user: {
      create: (...args: unknown[]) => mockPrismaUserCreate(...args),
    },
    cast: {
      create: (...args: unknown[]) => mockPrismaCastCreate(...args),
    },
  },
}));

vi.mock("next-auth", () => ({
  default: vi.fn((config) => ({
    handlers: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
    auth: vi.fn(),
    config,
  })),
}));

vi.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: vi.fn(() => ({})),
}));

vi.mock("next-auth/providers/line", () => ({
  default: vi.fn((config) => ({ id: "line", name: "LINE", ...config })),
}));
vi.mock("next-auth/providers/twitter", () => ({
  default: vi.fn((config) => ({ id: "twitter", name: "Twitter", ...config })),
}));
vi.mock("next-auth/providers/nodemailer", () => ({
  default: vi.fn((config) => ({ id: "nodemailer", name: "Nodemailer", ...config })),
}));

type AdapterCreateUser = (user: {
  id?: string;
  name?: string | null;
  email: string | null;
  emailVerified: Date | null;
  image?: string | null;
}) => Promise<unknown>;

async function getCreateUser(): Promise<AdapterCreateUser> {
  const NextAuth = (await import("next-auth")).default as ReturnType<typeof vi.fn>;
  await import("@/lib/auth");
  const config = NextAuth.mock.calls[0][0] as {
    adapter: { createUser: AdapterCreateUser };
  };
  return config.adapter.createUser;
}

describe("Auth adapter.createUser - Cast 自動生成のダミー値禁止", () => {
  beforeEach(() => {
    vi.resetModules();
    mockPrismaUserCreate.mockReset();
    mockPrismaCastCreate.mockReset();
    process.env.AUTH_LINE_ID = "line-id";
    process.env.AUTH_LINE_SECRET = "line-secret";
    process.env.AUTH_TWITTER_ID = "twitter-id";
    process.env.AUTH_TWITTER_SECRET = "twitter-secret";
    process.env.EMAIL_SERVER_HOST = "smtp.example.com";
    process.env.EMAIL_SERVER_PORT = "587";
    process.env.EMAIL_SERVER_USER = "user";
    process.env.EMAIL_SERVER_PASSWORD = "password";
    process.env.EMAIL_FROM = "noreply@example.com";
  });

  it("CAST ロールのとき Cast レコードが自動生成される", async () => {
    mockPrismaUserCreate.mockResolvedValueOnce({
      id: "user-1",
      email: "a@example.com",
      emailVerified: null,
      image: null,
      role: "CAST",
    });

    const createUser = await getCreateUser();
    await createUser({
      id: "ignored",
      name: "ignored",
      email: "a@example.com",
      emailVerified: null,
    });

    expect(mockPrismaCastCreate).toHaveBeenCalledTimes(1);
  });

  it("Cast 自動生成時に nickname が空文字で、age/isAvailableNow のダミー値が入らない", async () => {
    mockPrismaUserCreate.mockResolvedValueOnce({
      id: "user-2",
      email: "b@example.com",
      emailVerified: null,
      image: null,
      role: "CAST",
    });

    const createUser = await getCreateUser();
    await createUser({
      id: "ignored",
      name: "ignored",
      email: "b@example.com",
      emailVerified: null,
    });

    const callArgs = mockPrismaCastCreate.mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(callArgs.data.userId).toBe("user-2");
    // nickname は空文字。これまでの「ゲスト」ダミーをやめる
    expect(callArgs.data.nickname).toBe("");
    // age は未指定(schema が Int? なので DB は null)
    expect(callArgs.data.age).toBeUndefined();
    // isAvailableNow は未指定(schema default=false を使う)
    expect(callArgs.data.isAvailableNow).toBeUndefined();
    // 配列系は [] のままでよい
    expect(callArgs.data.photos).toEqual([]);
    expect(callArgs.data.desiredAreas).toEqual([]);
    expect(callArgs.data.preferredAtmosphere).toEqual([]);
    expect(callArgs.data.preferredClientele).toEqual([]);
  });

  it("非 CAST ロール(OWNER) のユーザーでは Cast を作らない", async () => {
    mockPrismaUserCreate.mockResolvedValueOnce({
      id: "user-3",
      email: "c@example.com",
      emailVerified: null,
      image: null,
      role: "OWNER",
    });

    const createUser = await getCreateUser();
    await createUser({
      id: "ignored",
      name: "ignored",
      email: "c@example.com",
      emailVerified: null,
    });

    expect(mockPrismaCastCreate).not.toHaveBeenCalled();
  });
});
