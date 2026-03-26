import type { NextConfig } from "next";
import dotenv from "dotenv";
import { getEnvFileOrder } from "./src/lib/env-files";

dotenv.config({ path: getEnvFileOrder(process.env.NODE_ENV) });

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
