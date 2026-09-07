import { router, publicProcedure } from "./trpc";

export const systemRouter = router({
  health: publicProcedure.query(() => ({ ok: true, service: "lingua-aberta", ts: Date.now() })),
  version: publicProcedure.query(() => ({ version: "1.0.0", name: "lingua-aberta" })),
});
