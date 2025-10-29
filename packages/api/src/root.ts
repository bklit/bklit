import { authRouter } from "./router/auth";
import { eventRouter } from "./router/event";
import { notificationRouter } from "./router/notification";
import { organizationRouter } from "./router/organization";
import { pageviewRouter } from "./router/pageview";
import { acquisitionRouter } from "./router/acquisition";
import { projectRouter } from "./router/project";
import { sessionRouter } from "./router/session";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  project: projectRouter,
  organization: organizationRouter,
  event: eventRouter,
  session: sessionRouter,
  pageview: pageviewRouter,
  acquisition: acquisitionRouter,
  notification: notificationRouter,
}) as const;

// export type definition of API
export type AppRouter = typeof appRouter;
