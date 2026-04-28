import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
    onError: ({ path, error, type, input }) => {
      console.error(
        `[trpc] ${type} ${path ?? "<no-path>"} failed code=${error.code} message=${error.message}`,
        {
          stack: error.stack,
          cause: error.cause instanceof Error ? error.cause.message : error.cause,
          input,
        }
      );
    },
  });

export { handler as GET, handler as POST };
