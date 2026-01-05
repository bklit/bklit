import { extensionRegistry } from "../core/registry";
import type { Extension } from "../core/schema";
import { type SlackConfig, slackConfigSchema } from "./config-schema";
import { sendToSlack } from "./handler";
import metadata from "./package.json";

const slackExtension: Extension<SlackConfig> = {
  id: "slack",
  metadata: {
    name: metadata.name,
    displayName: metadata.displayName,
    description: metadata.description,
    author: metadata.author,
    version: metadata.version,
    icon: metadata.icon,
    category: metadata.category as "notifications",
    isPro: metadata.isPro,
    rateLimit: metadata.rateLimit,
  },
  configSchema: slackConfigSchema,
  handler: sendToSlack,
};

// Register the extension
extensionRegistry.register(slackExtension);

export { slackExtension };
