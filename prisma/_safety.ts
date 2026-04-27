/**
 * 破壊的 prisma スクリプトを本番 DB で誤実行しないためのガード。
 *
 * 2026-04-27 の incident: prisma/delete-non-seed-users.ts と同型の
 * `DELETE FROM users WHERE id NOT IN (...)` パターンが本番に対して
 * 走り、 全 OWNER + 関連 Cast/Store がカスケード削除された。
 *
 * 各破壊的スクリプトの先頭で `assertNotProductionDb(scriptName)` を
 * 呼び、production-like な DB (Supabase remote) では明示的な
 * `--allow-production` または `ALLOW_PRODUCTION_DESTRUCTIVE=true` 無しに
 * 実行できないようにする。
 */
import { URL } from "url";

const LOCAL_DB_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "postgres",
  "supabase_db",
  "db",
]);

function classifyHost(host: string): "local" | "supabase-remote" | "unknown" {
  const hostnameOnly = host.split(":")[0];
  if (LOCAL_DB_HOSTS.has(hostnameOnly)) return "local";
  if (hostnameOnly.endsWith(".supabase.co")) return "supabase-remote";
  if (hostnameOnly.endsWith(".supabase.com")) return "supabase-remote";
  if (hostnameOnly.endsWith(".pooler.supabase.com")) return "supabase-remote";
  return "unknown";
}

function isAllowed(): boolean {
  return (
    process.argv.includes("--allow-production") ||
    process.env.ALLOW_PRODUCTION_DESTRUCTIVE === "true"
  );
}

export function assertNotProductionDb(scriptName: string): void {
  const raw = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
  let host = "";
  try {
    host = new URL(raw).host;
  } catch {
    // パース失敗 → 念のため拒否
    if (!isAllowed()) {
      console.error(
        `🛑 [${scriptName}] DATABASE_URL のパースに失敗。安全のため停止。`,
      );
      process.exit(1);
    }
  }

  const kind = classifyHost(host);

  if (kind === "local") {
    return;
  }

  if (isAllowed()) {
    console.warn(
      `⚠️  [${scriptName}] production-like DB host (${host}) に対し ALLOW_PRODUCTION_DESTRUCTIVE が ON で実行中`,
    );
    return;
  }

  if (kind === "supabase-remote") {
    console.error(
      `🛑 [${scriptName}] production-like DB host (${host}) を検知。`,
    );
    console.error(`   破壊的スクリプトなのでデフォルトで拒否しました。`);
    console.error(
      `   本当に実行する場合: --allow-production フラグ または ALLOW_PRODUCTION_DESTRUCTIVE=true 環境変数`,
    );
    process.exit(1);
  }

  console.error(
    `🛑 [${scriptName}] 不明な DB host (${host || "(empty)"}) を検知。`,
  );
  console.error(
    `   localhost / *.supabase.co のいずれでもないので念のため停止。`,
  );
  console.error(
    `   実行する場合: --allow-production または ALLOW_PRODUCTION_DESTRUCTIVE=true`,
  );
  process.exit(1);
}
