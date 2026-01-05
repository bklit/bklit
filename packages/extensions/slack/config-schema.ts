import { z } from "zod";

export const slackConfigSchema = z.object({
  webhookUrl: z.string().url().describe("Slack Webhook URL"),
});

export type SlackConfig = z.infer<typeof slackConfigSchema>;
