import { acquisitionRouter } from "./router/acquisition";
import { authRouter } from "./router/auth";
import { emailRouter } from "./router/email";
import { eventRouter } from "./router/event";
import { notificationRouter } from "./router/notification";
import { organizationRouter } from "./router/organization";
import { pageviewRouter } from "./router/pageview";
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
  email: emailRouter,
}) as const;

// export type definition of API
export type AppRouter = typeof appRouter;
