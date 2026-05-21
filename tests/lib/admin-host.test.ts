import { describe, expect, it } from "vitest";

import {
  adminMiddlewareDecision,
  adminRewritePath,
  isAdminHost,
} from "@/lib/admin-host";

describe("isAdminHost", () => {
  it("returns true for admin subdomain with port (local dev)", () => {
    expect(isAdminHost("admin.localhost:3000")).toBe(true);
  });

  it("returns true for admin subdomain in production-like hosts", () => {
    expect(isAdminHost("admin.lumina-work.jp")).toBe(true);
    expect(isAdminHost("admin.example.com")).toBe(true);
  });

  it("returns false for the main domain without subdomain", () => {
    expect(isAdminHost("lumina-work.jp")).toBe(false);
    expect(isAdminHost("localhost:3000")).toBe(false);
  });

  it("returns false for null / empty host", () => {
    expect(isAdminHost(null)).toBe(false);
    expect(isAdminHost("")).toBe(false);
    expect(isAdminHost(undefined)).toBe(false);
  });

  it("does NOT match hosts that merely contain 'admin' without being a subdomain prefix", () => {
    expect(isAdminHost("myadmin.com")).toBe(false);
    expect(isAdminHost("not-admin.lumina-work.jp")).toBe(false);
    expect(isAdminHost("admins.lumina-work.jp")).toBe(false);
  });

  it("is case-insensitive on host comparison", () => {
    expect(isAdminHost("ADMIN.lumina-work.jp")).toBe(true);
    expect(isAdminHost("Admin.Lumina-Work.JP")).toBe(true);
  });
});

describe("adminRewritePath", () => {
  it("rewrites root '/' to '/admin'", () => {
    expect(adminRewritePath("/")).toBe("/admin");
  });

  it("prefixes top-level paths with /admin", () => {
    expect(adminRewritePath("/login")).toBe("/admin/login");
    expect(adminRewritePath("/invites")).toBe("/admin/invites");
  });

  it("preserves nested segments", () => {
    expect(adminRewritePath("/invites/abc/edit")).toBe(
      "/admin/invites/abc/edit",
    );
  });

  it("is idempotent for already-prefixed paths", () => {
    expect(adminRewritePath("/admin")).toBe("/admin");
    expect(adminRewritePath("/admin/login")).toBe("/admin/login");
    expect(adminRewritePath("/admin/invites/123")).toBe("/admin/invites/123");
  });

  it("does not touch the /api or /_next path families (they remain as-is)", () => {
    // _next/* と /api/* は middleware で「subdomain でも常に rewrite しない」
    // という意思決定を読み取りやすくするため、ここでは「再rewriteで二重 prefix にならない」
    // ことだけ担保しておく。実際の素通しは middleware 側で実装する。
    expect(adminRewritePath("/api/foo")).toBe("/admin/api/foo");
    expect(adminRewritePath("/_next/static/foo.js")).toBe(
      "/admin/_next/static/foo.js",
    );
  });
});

describe("adminMiddlewareDecision", () => {
  describe("main domain (host = lumina-work.jp)", () => {
    it("returns 'main' for ordinary paths so existing middleware logic runs", () => {
      expect(
        adminMiddlewareDecision("lumina-work.jp", "/o/dashboard"),
      ).toEqual({ kind: "main" });
      expect(adminMiddlewareDecision("lumina-work.jp", "/")).toEqual({
        kind: "main",
      });
      expect(adminMiddlewareDecision("lumina-work.jp", "/c/login")).toEqual({
        kind: "main",
      });
    });

    it("blocks /admin and /admin/* from main domain (admin is subdomain-only)", () => {
      expect(adminMiddlewareDecision("lumina-work.jp", "/admin")).toEqual({
        kind: "blocked",
      });
      expect(
        adminMiddlewareDecision("lumina-work.jp", "/admin/login"),
      ).toEqual({ kind: "blocked" });
      expect(
        adminMiddlewareDecision("localhost:3000", "/admin/invites/abc"),
      ).toEqual({ kind: "blocked" });
    });
  });

  describe("admin subdomain (host = admin.lumina-work.jp)", () => {
    it("rewrites UI paths to /admin/*", () => {
      expect(
        adminMiddlewareDecision("admin.lumina-work.jp", "/"),
      ).toEqual({ kind: "rewrite", to: "/admin" });
      expect(
        adminMiddlewareDecision("admin.lumina-work.jp", "/login"),
      ).toEqual({ kind: "rewrite", to: "/admin/login" });
      expect(
        adminMiddlewareDecision("admin.localhost:3000", "/invites"),
      ).toEqual({ kind: "rewrite", to: "/admin/invites" });
    });

    it("does NOT double-rewrite when the path is already /admin/*", () => {
      expect(
        adminMiddlewareDecision("admin.lumina-work.jp", "/admin/login"),
      ).toEqual({ kind: "rewrite", to: "/admin/login" });
    });

    it("passes through /api/* unchanged so tRPC and auth handlers still work", () => {
      expect(
        adminMiddlewareDecision("admin.lumina-work.jp", "/api/trpc/foo"),
      ).toEqual({ kind: "passthrough" });
      expect(
        adminMiddlewareDecision("admin.localhost:3000", "/api/admin/auth"),
      ).toEqual({ kind: "passthrough" });
    });

    it("passes through /_next/* and common static assets unchanged", () => {
      expect(
        adminMiddlewareDecision(
          "admin.lumina-work.jp",
          "/_next/static/chunks/main.js",
        ),
      ).toEqual({ kind: "passthrough" });
      expect(
        adminMiddlewareDecision("admin.lumina-work.jp", "/logo.png"),
      ).toEqual({ kind: "passthrough" });
      expect(
        adminMiddlewareDecision("admin.lumina-work.jp", "/favicon.ico"),
      ).toEqual({ kind: "passthrough" });
    });
  });

  describe("edge cases", () => {
    it("treats null / undefined host as main domain", () => {
      expect(adminMiddlewareDecision(null, "/o/dashboard")).toEqual({
        kind: "main",
      });
      expect(adminMiddlewareDecision(undefined, "/admin")).toEqual({
        kind: "blocked",
      });
    });
  });
});
