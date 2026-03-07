import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("MessageNotificationThrottle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("初回の通知は許可される", async () => {
    const { shouldThrottle } = await import(
      "@/server/notifications/throttle"
    );

    const result = shouldThrottle("match-1", "user-1");
    expect(result).toBe(false);
  });

  it("5分以内の同一キーは抑制される", async () => {
    const { shouldThrottle } = await import(
      "@/server/notifications/throttle"
    );

    shouldThrottle("match-1", "user-1"); // 初回
    const result = shouldThrottle("match-1", "user-1"); // 5分以内の2回目
    expect(result).toBe(true);
  });

  it("5分経過後は再び許可される", async () => {
    const { shouldThrottle } = await import(
      "@/server/notifications/throttle"
    );

    shouldThrottle("match-1", "user-1"); // 初回

    // 5分1秒経過
    vi.advanceTimersByTime(5 * 60 * 1000 + 1000);

    const result = shouldThrottle("match-1", "user-1");
    expect(result).toBe(false);
  });

  it("異なるmatchIdは独立してスロットリングされる", async () => {
    const { shouldThrottle } = await import(
      "@/server/notifications/throttle"
    );

    shouldThrottle("match-1", "user-1"); // match-1初回
    const result = shouldThrottle("match-2", "user-1"); // match-2初回
    expect(result).toBe(false);
  });

  it("異なるユーザーは独立してスロットリングされる", async () => {
    const { shouldThrottle } = await import(
      "@/server/notifications/throttle"
    );

    shouldThrottle("match-1", "user-1"); // user-1初回
    const result = shouldThrottle("match-1", "user-2"); // user-2初回
    expect(result).toBe(false);
  });
});
