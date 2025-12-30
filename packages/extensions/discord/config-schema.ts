import { z } from "zod";

export const discordConfigSchema = z.object({
  webhookUrl: z.string().url().describe("Discord Webhook URL"),
});

export type DiscordConfig = z.infer<typeof discordConfigSchema>;
