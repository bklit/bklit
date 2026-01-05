import type { EventData } from "../core/schema";
import type { SlackConfig } from "./config-schema";

export async function sendToSlack(
  config: SlackConfig,
  event: EventData,
): Promise<void> {
  // Skip "view" events to prevent spam
  if (event.eventType === "view") {
    return;
  }

  // Format as Slack Block Kit message
  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `🎯 ${event.trackingId}`,
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Event:* ${event.eventType}`,
      },
    },
  ];

  // Add metadata fields if present
  if (event.metadata && Object.keys(event.metadata).length > 0) {
    const fields = Object.entries(event.metadata).map(([key, value]) => ({
      type: "mrkdwn",
      text: `*${key}:* ${String(value)}`,
    }));

    blocks.push({
      type: "section",
      fields: fields.slice(0, 10), // Slack allows max 10 fields
    });
  }

  // Add context footer
  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Project ID: ${event.projectId} • ${new Date(event.timestamp).toLocaleString()}`,
      },
    ],
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

  try {
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `Slack webhook failed: ${response.status} ${response.statusText}`,
      );
    }
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Slack webhook timeout after 5 seconds");
    }
    throw error;
  }
}
