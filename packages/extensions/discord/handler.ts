import type { EventData } from "../core/schema";
import type { DiscordConfig } from "./config-schema";

export async function sendToDiscord(
  config: DiscordConfig,
  event: EventData,
): Promise<void> {
  // Skip "view" events to prevent spam
  if (event.eventType === "view") {
    return;
  }

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

  try {
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `Discord webhook failed: ${response.status} ${response.statusText}`,
      );
    }
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Discord webhook timeout after 5 seconds");
    }
    throw error;
  }
}
