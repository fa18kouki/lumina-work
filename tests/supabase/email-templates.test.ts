import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const TEMPLATES_DIR = join(process.cwd(), "supabase", "templates");

const FONT_FAMILY_SNIPPET =
  "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', 'Yu Gothic', YuGothic, Meiryo, sans-serif";

describe("Supabase メールテンプレート", () => {
  for (const name of ["magic-link.html", "reset-password.html", "confirm-signup.html"]) {
    it(`${name} はロゴが SiteURL 相対で、サンセリフの font-family を持つ`, () => {
      const html = readFileSync(join(TEMPLATES_DIR, name), "utf-8");
      expect(html).toContain('src="{{ .SiteURL }}/Apple_Touch_Icon_180x180.png"');
      expect(html).toContain(FONT_FAMILY_SNIPPET);
    });
  }
});
