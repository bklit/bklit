import { extensionRegistry } from "../core/registry";
import type { Extension } from "../core/schema";
import { type DiscordConfig, discordConfigSchema } from "./config-schema";
import { sendToDiscord } from "./handler";
import metadata from "./package.json";

const discordExtension: Extension<DiscordConfig> = {
  id: "discord",
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
  configSchema: discordConfigSchema,
  handler: sendToDiscord,
};

// Register the extension
extensionRegistry.register(discordExtension);

export { discordExtension };
