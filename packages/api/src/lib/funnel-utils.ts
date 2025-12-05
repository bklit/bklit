/**
 * Utility functions for funnel tracking and matching
 */

/**
 * Extract pathname from a URL string
 * Handles both full URLs (https://example.com/path) and paths (/path)
 */
function extractPathname(url: string): string {
  try {
    // If it's already a path (starts with /), return it normalized
    if (url.startsWith("/")) {
      return url.split("?")[0].split("#")[0] || "/";
    }

    // Try to parse as full URL
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    // Normalize: ensure it starts with / and handle root path
    return pathname === "" ? "/" : pathname;
  } catch {
    // If URL parsing fails, try to extract path manually
    const match = url.match(/^https?:\/\/[^/]+(\/.*)?$/);
    if (match) {
      const path = match[1] || "/";
      return path.split("?")[0].split("#")[0] || "/";
    }
    // If all else fails, treat as path
    return url.split("?")[0].split("#")[0] || "/";
  }
}

/**
 * Normalize a path for comparison
 * - Removes query params and hash
 * - Ensures leading slash
 * - Handles root path
 */
function normalizePath(path: string): string {
  const cleaned = path.split("?")[0].split("#")[0].trim();
  if (cleaned === "" || cleaned === "/") {
    return "/";
  }
  // Ensure leading slash
  return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
}

/**
 * Match a pageview URL to a funnel step URL
 * Supports exact matching (with pathname extraction)
 */
export function matchPageviewToStep(
  pageviewUrl: string,
  stepUrl: string,
): boolean {
  const pageviewPath = normalizePath(extractPathname(pageviewUrl));
  const stepPath = normalizePath(extractPathname(stepUrl));

  // Exact match
  return pageviewPath === stepPath;
}

/**
 * Build a map of trackingId -> eventDefinitionId for efficient lookup
 */
export async function buildEventDefinitionMap(
  prisma: {
    eventDefinition: {
      findMany: (args: {
        where: {
          projectId: string;
          trackingId: { in: string[] };
        };
        select: {
          id: true;
          trackingId: true;
        };
      }) => Promise<Array<{ id: string; trackingId: string }>>;
    };
  },
  projectId: string,
  trackingIds: string[],
): Promise<Map<string, string>> {
  if (trackingIds.length === 0) {
    return new Map();
  }

  const eventDefinitions = await prisma.eventDefinition.findMany({
    where: {
      projectId,
      trackingId: {
        in: trackingIds,
      },
    },
    select: {
      id: true,
      trackingId: true,
    },
  });

  const map = new Map<string, string>();
  for (const eventDef of eventDefinitions) {
    map.set(eventDef.trackingId, eventDef.id);
  }

  return map;
}

/**
 * Interface for step completion tracking
 */
export interface StepCompletion {
  stepId: string;
  stepOrder: number;
  completedAt: Date;
}

/**
 * Match a session to funnel steps and return completed steps
 */
export function matchSessionToFunnel(
  session: {
    pageViewEvents: Array<{ url: string; timestamp: Date }>;
    trackedEvents: Array<{
      timestamp: Date;
      eventDefinition: { trackingId: string } | null;
    }>;
  },
  steps: Array<{
    id: string;
    stepOrder: number;
    type: string;
    url?: string | null;
    eventName?: string | null;
  }>,
  eventDefinitionMap: Map<string, string>,
): StepCompletion[] {
  const completions: StepCompletion[] = [];

  // Combine and sort all events by timestamp
  const allEvents: Array<{
    type: "pageview" | "event";
    timestamp: Date;
    url?: string;
    eventTrackingId?: string;
  }> = [
    ...session.pageViewEvents.map((pv) => ({
      type: "pageview" as const,
      timestamp: pv.timestamp,
      url: pv.url,
    })),
    ...session.trackedEvents
      .filter((e) => e.eventDefinition)
      .map((e) => ({
        type: "event" as const,
        timestamp: e.timestamp,
        eventTrackingId: e.eventDefinition!.trackingId,
      })),
  ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Track which step we're currently looking for
  let currentStepIndex = 0;

  // Process events in chronological order
  for (const event of allEvents) {
    // If we've completed all steps, stop
    if (currentStepIndex >= steps.length) {
      break;
    }

    const currentStep = steps[currentStepIndex];

    let stepMatched = false;

    if (currentStep.type === "pageview" && event.type === "pageview") {
      // Match pageview step
      if (
        currentStep.url &&
        matchPageviewToStep(event.url || "", currentStep.url)
      ) {
        stepMatched = true;
      }
    } else if (currentStep.type === "event" && event.type === "event") {
      // Match event step
      if (
        currentStep.eventName &&
        event.eventTrackingId === currentStep.eventName
      ) {
        stepMatched = true;
      }
    }

    if (stepMatched) {
      completions.push({
        stepId: currentStep.id,
        stepOrder: currentStep.stepOrder,
        completedAt: event.timestamp,
      });
      // Move to next step
      currentStepIndex++;
    }
  }

  return completions;
}
