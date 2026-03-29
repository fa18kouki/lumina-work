import type { NextConfig } from "next";
import dotenv from "dotenv";
import { getEnvFileOrder } from "./src/lib/env-files";

dotenv.config({ path: getEnvFileOrder(process.env.NODE_ENV) });

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
    ],
  },
};

export default nextConfig;
