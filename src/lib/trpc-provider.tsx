"use client";

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";
import { trpc } from "./trpc";

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

function handleUnauthorized(error: unknown) {
  if (typeof window === "undefined") return;
  const err = error as { data?: { code?: string; httpStatus?: number } };
  const isUnauthorized =
    err?.data?.code === "UNAUTHORIZED" || err?.data?.httpStatus === 401;
  if (!isUnauthorized) return;

  const path = window.location.pathname;
  const loginUrl = path.startsWith("/s/") ? "/s/login" : "/c/login";
  if (!path.includes("login")) {
    window.location.href = loginUrl;
  }
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: handleUnauthorized,
        }),
      })
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
