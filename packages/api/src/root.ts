import { acquisitionRouter } from "./router/acquisition";
import { apiTokenRouter } from "./router/api-token";
import { authRouter } from "./router/auth";
import { emailRouter } from "./router/email";
import { eventRouter } from "./router/event";
import { extensionRouter } from "./router/extension";
import { funnelRouter } from "./router/funnel";
import { invitationRouter } from "./router/invitation";
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
  extension: extensionRouter,
  funnel: funnelRouter,
  session: sessionRouter,
  pageview: pageviewRouter,
  acquisition: acquisitionRouter,
  notification: notificationRouter,
  email: emailRouter,
  apiToken: apiTokenRouter,
  invitation: invitationRouter,
}) as const;

// export type definition of API
export type AppRouter = typeof appRouter;
