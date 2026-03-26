import dotenv from "dotenv";
import { getEnvFileOrder } from "../src/lib/env-files";

dotenv.config({ path: getEnvFileOrder(process.env.NODE_ENV) });

// グローバルタイムアウト設定
import { vi } from "vitest";

// テスト環境の設定
process.env.NODE_ENV = "test";
