import type { NextConfig } from "next";
import dotenv from "dotenv";
import { getEnvFileOrder } from "./src/lib/env-files";
import { buildSupabaseImageRemotePatterns } from "./src/lib/supabase-image-host";

dotenv.config({ path: getEnvFileOrder(process.env.NODE_ENV) });

// BUG-4: Supabase Storage のホストは env (NEXT_PUBLIC_SUPABASE_URL) から動的に取得する。
// ハードコードしないことで、複数プロジェクト / 環境ごとに自動追従する。
const supabaseImagePatterns = buildSupabaseImageRemotePatterns(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "profile.line-scdn.net",
      },
      {
        protocol: "https",
        hostname: "sprofile.line-scdn.net",
      },
      ...supabaseImagePatterns,
    ],
  },
};

export default nextConfig;
