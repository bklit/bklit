import { authRouter } from "./router/auth";
import { eventRouter } from "./router/event";
import { organizationRouter } from "./router/organization";
import { projectRouter } from "./router/project";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  project: projectRouter,
  organization: organizationRouter,
  event: eventRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
