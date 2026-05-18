import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";
import { DELETE, POST } from "@/app/api/admin/auth/route";
import { NextRequest } from "next/server";

const SECRET = "test-key-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://admin.localhost/api/admin/auth", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

interface CookieSetOptions {
  name: string;
  value: string;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
}

interface CapturedResponse extends Response {
  cookies: {
    _captured: () => CookieSetOptions[];
  };
}

describe("POST /api/admin/auth", () => {
  beforeEach(() => {
    process.env.ADMIN_API_KEY = SECRET;
  });

  afterEach(() => {
    delete process.env.ADMIN_API_KEY;
  });

  it("503 when ADMIN_API_KEY is not configured", async () => {
    delete process.env.ADMIN_API_KEY;
    const res = await POST(makeRequest({ apiKey: "anything" }));
    expect(res.status).toBe(503);
  });

  it("400 for invalid body shape", async () => {
    const res = await POST(makeRequest({ notApiKey: "wat" }));
    expect(res.status).toBe(400);
  });

  it("401 for wrong API key (and no cookie is set)", async () => {
    const res = (await POST(makeRequest({ apiKey: "wrong-key" }))) as CapturedResponse;
    expect(res.status).toBe(401);
    expect(res.cookies._captured()).toHaveLength(0);
  });

  it("200 + HttpOnly admin-session cookie for valid API key", async () => {
    const res = (await POST(makeRequest({ apiKey: SECRET }))) as CapturedResponse;
    expect(res.status).toBe(200);
    const captured = res.cookies._captured();
    expect(captured).toHaveLength(1);
    const cookie = captured[0];
    expect(cookie.name).toBe(ADMIN_SESSION_COOKIE);
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe("lax");
    expect(cookie.path).toBe("/");
    // 24h ± 1s
    expect(cookie.maxAge).toBe(24 * 60 * 60);
    expect(cookie.value).toMatch(/\./);
  });
});

describe("DELETE /api/admin/auth (logout)", () => {
  it("200 + clears admin-session cookie (maxAge=0)", async () => {
    const res = (await DELETE()) as CapturedResponse;
    expect(res.status).toBe(200);
    const captured = res.cookies._captured();
    expect(captured).toHaveLength(1);
    expect(captured[0].name).toBe(ADMIN_SESSION_COOKIE);
    expect(captured[0].maxAge).toBe(0);
    expect(captured[0].value).toBe("");
  });
});
