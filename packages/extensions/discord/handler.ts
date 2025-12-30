import type { EventData } from "../core/schema";
import type { DiscordConfig } from "./config-schema";

export async function sendToDiscord(
  config: DiscordConfig,
  event: EventData,
): Promise<void> {
  const embed = {
    title: `🎯 ${event.trackingId}`,
    description: `Event: **${event.eventType}**`,
    color: 0x00d084, // Bklit green
    fields: Object.entries(event.metadata || {}).map(([key, value]) => ({
      name: key,
      value: String(value),
      inline: true,
    })),
    timestamp: event.timestamp,
    footer: {
      text: `Project ID: ${event.projectId}`,
    },
  };

  const response = await fetch(config.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] }),
  });

  if (!response.ok) {
    throw new Error(
      `Discord webhook failed: ${response.status} ${response.statusText}`,
    );
  }
}
