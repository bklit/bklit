import { extensionRegistry } from "../core/registry";
import type { Extension } from "../core/schema";
import { type GitHubConfig, githubConfigSchema } from "./config-schema";
import metadata from "./package.json";

const githubExtension: Extension<GitHubConfig> = {
  id: "github",
  metadata: {
    name: metadata.name,
    displayName: metadata.displayName,
    description: metadata.description,
    author: metadata.author,
    version: metadata.version,
    icon: metadata.icon,
    category: metadata.category as "analytics",
    isPro: metadata.isPro,
  },
  configSchema: githubConfigSchema,
  handler: async () => {
    // Uses webhooks instead - no periodic handler needed
  },
};

// Register the extension
extensionRegistry.register(githubExtension);

export { githubExtension };
