import { prisma } from "@bklit/db/client";
import { task } from "@trigger.dev/sdk/v3";

interface HealthCheckResult {
  endpoint: string;
  statusCode: number;
  responseTimeMs: number;
  isHealthy: boolean;
  errorMessage?: string;
}

interface EndpointAlertState {
  consecutiveFailures: number;
  lastAlertSentAt?: Date;
  isInAlertState: boolean;
}

const ALERT_THRESHOLD = 60; // 60 checks = 5 minutes at 5-second intervals
const TIMEOUT_MS = 10000; // 10 seconds
const SLOW_RESPONSE_MS = 5000; // 5 seconds

// In-memory state to track consecutive failures per endpoint
const alertState = new Map<string, EndpointAlertState>();

function getBaseUrl(): string {
  // Use NEXT_PUBLIC_APP_URL if set (works for both dev and prod)
  // In dev mode with ngrok, this should be set to the ngrok URL
  // In production, this should be set to https://app.bklit.com
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) {
    return envUrl;
  }

  // Check if we're in development mode
  const isDev =
    process.env.NODE_ENV === "development" ||
    process.env.TRIGGER_ENV === "development";

  if (isDev) {
    // Development: check for ngrok URL (only in dev mode)
    const ngrokUrl = process.env.NGROK_URL || process.env.VITE_NGROK_URL;
    if (ngrokUrl) {
      return ngrokUrl;
    }
    // Development fallback: use localhost (won't work from Trigger.dev cloud, but good fallback)
    return "http://localhost:3000";
  }

  // Production: use production URL
  return "https://app.bklit.com";
}

async function checkEndpoint(
  endpoint: string,
  payload: Record<string, unknown>,
): Promise<HealthCheckResult> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;
    const statusCode = response.status;

    // Determine if healthy:
    // - Status 200-499: endpoint is responding - consider healthy
    //   - 200: fully healthy
    //   - 401/403: endpoint responding, just needs auth
    //   - Other 4xx: endpoint responding, client error
    // - Status 5xx: server error - unhealthy
    // - Status 0: connection error/timeout - unhealthy
    // - Timeout or slow response (>5s): unhealthy
    const isHealthy =
      statusCode >= 200 &&
      statusCode < 500 && // Any 2xx/3xx/4xx means endpoint is responding
      responseTimeMs < SLOW_RESPONSE_MS &&
      !controller.signal.aborted;

    return {
      endpoint,
      statusCode,
      responseTimeMs,
      isHealthy,
      errorMessage: isHealthy
        ? undefined
        : `Status: ${statusCode}, Response time: ${responseTimeMs}ms`,
    };
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return {
      endpoint,
      statusCode: 0,
      responseTimeMs,
      isHealthy: false,
      errorMessage: `Error: ${errorMessage}`,
    };
  }
}

async function handleAlerting(
  endpoint: string,
  isHealthy: boolean,
): Promise<void> {
  const state = alertState.get(endpoint) || {
    consecutiveFailures: 0,
    isInAlertState: false,
  };

  if (!isHealthy) {
    state.consecutiveFailures++;
    state.isInAlertState = true;

    // Check if we should send an alert
    if (
      state.consecutiveFailures >= ALERT_THRESHOLD &&
      !state.lastAlertSentAt
    ) {
      // Send email alert (lazy import to avoid env validation errors)
      try {
        const { sendEmail } = await import("@bklit/email/client");
        const { ApiHealthAlertEmail } = await import(
          "@bklit/email/emails/api-health-alert"
        );

        await sendEmail({
          to: "matt@bklit.com",
          subject: `API Health Alert: ${endpoint} is down`,
          react: ApiHealthAlertEmail({
            endpoint,
            consecutiveFailures: state.consecutiveFailures,
            durationMinutes: (state.consecutiveFailures * 5) / 60,
          }),
        });

        state.lastAlertSentAt = new Date();
        console.log(
          `Alert sent for ${endpoint} after ${state.consecutiveFailures} failures`,
        );
      } catch (error) {
        console.error(`Failed to send alert for ${endpoint}:`, error);
        // Continue even if email fails
      }
    }
  } else {
    // Health recovered - reset state
    if (state.isInAlertState) {
      console.log(
        `Health recovered for ${endpoint} after ${state.consecutiveFailures} failures`,
      );
    }
    state.consecutiveFailures = 0;
    state.isInAlertState = false;
    state.lastAlertSentAt = undefined;
  }

  alertState.set(endpoint, state);
}

export const healthCheckTask = task({
  id: "health-check",
  trigger: {
    type: "scheduled",
    cron: "*/5 * * * * *", // Every 5 seconds
  },
  retry: {
    maxAttempts: 3,
  },
  run: async (payload, { ctx }) => {
    const baseUrl = getBaseUrl();
    const timestamp = new Date();

    // Check /api/track endpoint
    const trackResult = await checkEndpoint("/api/track", {
      url: "https://example.com/test",
      timestamp: timestamp.toISOString(),
      projectId: "health-check-test",
      userAgent: "HealthCheck/1.0",
    });

    // Check /api/track-event endpoint
    const trackEventResult = await checkEndpoint("/api/track-event", {
      trackingId: "health-check-test",
      eventType: "health_check",
      timestamp: timestamp.toISOString(),
      projectId: "health-check-test",
    });

    const results = [trackResult, trackEventResult];

    // Store results in database
    for (const result of results) {
      await prisma.apiHealthCheck.create({
        data: {
          endpoint: result.endpoint,
          statusCode: result.statusCode,
          responseTimeMs: result.responseTimeMs,
          isHealthy: result.isHealthy,
          errorMessage: result.errorMessage,
          timestamp,
        },
      });

      // Handle alerting
      await handleAlerting(result.endpoint, result.isHealthy);
    }

    return {
      success: true,
      results: results.map((r) => ({
        endpoint: r.endpoint,
        isHealthy: r.isHealthy,
        statusCode: r.statusCode,
        responseTimeMs: r.responseTimeMs,
      })),
    };
  },
});
