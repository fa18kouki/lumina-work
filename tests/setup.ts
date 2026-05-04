import dotenv from "dotenv";
import { getEnvFileOrder } from "../src/lib/env-files";

dotenv.config({ path: getEnvFileOrder(process.env.NODE_ENV) });

// グローバルタイムアウト設定
import { vi } from "vitest";

// テスト環境の設定
process.env.NODE_ENV = "test";

// Storage polyfill (jsdom + Node 25 native Storage の競合回避)
//   Node 25 は native localStorage を持っているが --localstorage-file が無いと
//   API メソッドが undefined になる。jsdom でも上書きできていないことがあるため、
//   in-memory な Storage を強制的に再定義する。
if (typeof window !== "undefined") {
  void vi; // setup でだけ vi を使うため lint 回避

  function makeMemStorage(): Storage {
    const map = new Map<string, string>();
    return {
      get length() {
        return map.size;
      },
      clear: () => map.clear(),
      getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
      key: (i: number) => Array.from(map.keys())[i] ?? null,
      removeItem: (k: string) => {
        map.delete(k);
      },
      setItem: (k: string, v: string) => {
        map.set(k, String(v));
      },
    };
  }

  Object.defineProperty(window, "localStorage", {
    value: makeMemStorage(),
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window, "sessionStorage", {
    value: makeMemStorage(),
    configurable: true,
    writable: true,
  });
}
