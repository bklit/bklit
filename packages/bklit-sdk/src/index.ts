// packages/bklit-sdk/src/index.ts

interface BklitOptions {
  siteId: string;
  apiHost?: string; // Optional: defaults to your production API endpoint
}

const DEFAULT_API_HOST = "http://localhost:3000/api/track"; // Replace with your actual production URL
let currentSessionId: string | null = null; // Keep track of current session
let lastTrackedUrl: string | null = null; // Track last URL to prevent duplicates
let lastTrackedTime: number = 0; // Track last tracking time
const TRACKING_DEBOUNCE_MS = 1000; // Debounce tracking by 1 second

export function initBklit(options: BklitOptions): void {
  if (typeof window === "undefined") {
    // Avoid running server-side if accidentally imported there directly
    return;
  }

  const { siteId, apiHost = DEFAULT_API_HOST } = options;

  if (!siteId) {
    console.error("❌ Bklit SDK: siteId is required for initialization.");
    return;
  }

  console.log("🎯 Bklit SDK: Initializing with configuration", {
    siteId,
    apiHost,
    userAgent: navigator.userAgent.substring(0, 50) + "...",
  });

  // Store configuration globally for manual tracking
  window.bklitSiteId = siteId;
  window.bklitApiHost = apiHost;

  // Generate or get existing session ID
  if (!currentSessionId) {
    currentSessionId = generateSessionId();
    // Reset tracking state for new session
    lastTrackedUrl = null;
    lastTrackedTime = 0;
    console.log("🆔 Bklit SDK: New session created", {
      sessionId: currentSessionId,
    });
  } else {
    console.log("🔄 Bklit SDK: Using existing session", {
      sessionId: currentSessionId,
    });
  }

  async function trackPageView() {
    const currentUrl = window.location.href;
    const now = Date.now();

    // Check if we should skip this tracking request
    if (
      lastTrackedUrl === currentUrl &&
      now - lastTrackedTime < TRACKING_DEBOUNCE_MS
    ) {
      console.log("⏭️ Bklit SDK: Skipping duplicate page view tracking", {
        url: currentUrl,
        timeSinceLastTrack: now - lastTrackedTime,
        debounceMs: TRACKING_DEBOUNCE_MS,
      });
      return;
    }

    try {
      const data = {
        url: currentUrl,
        timestamp: new Date().toISOString(),
        siteId: siteId,
        userAgent: navigator.userAgent,
        sessionId: currentSessionId,
        referrer: document.referrer || undefined,
      };

      console.log("🚀 Bklit SDK: Tracking page view...", {
        url: data.url,
        sessionId: data.sessionId,
        siteId: data.siteId,
      });

      const response = await fetch(apiHost, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        keepalive: true,
      });

      if (response.ok) {
        // Update tracking state only on success
        lastTrackedUrl = currentUrl;
        lastTrackedTime = now;

        console.log("✅ Bklit SDK: Page view tracked successfully!", {
          url: data.url,
          sessionId: data.sessionId,
          status: response.status,
        });
      } else {
        console.error(
          `❌ Bklit SDK: Failed to track page view for site ${siteId}. Status: ${response.statusText}`
        );
      }
    } catch (error) {
      console.error(
        `❌ Bklit SDK: Error tracking page view for site ${siteId}:`,
        error
      );
    }
  }

  // Track initial page view
  console.log("🎯 Bklit SDK: Initializing page view tracking...");
  trackPageView();

  // Cleanup on page unload
  const handlePageUnload = async () => {
    // End the session when user leaves
    if (currentSessionId) {
      try {
        console.log("🔄 Bklit SDK: Ending session on page unload...", {
          sessionId: currentSessionId,
          siteId: siteId,
        });

        const endSessionUrl = apiHost + "/session-end";
        const response = await fetch(endSessionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: currentSessionId,
            siteId: siteId,
          }),
          keepalive: true, // Important for sending data before page unloads
        });

        if (response.ok) {
          console.log("✅ Bklit SDK: Session ended successfully!", {
            sessionId: currentSessionId,
            status: response.status,
          });
        } else {
          console.error("❌ Bklit SDK: Failed to end session", {
            sessionId: currentSessionId,
            status: response.status,
            statusText: response.statusText,
          });
        }
      } catch (error) {
        console.error("❌ Bklit SDK: Error ending session:", error);
      }
    }
  };

  window.removeEventListener("beforeunload", handlePageUnload); // Remove first to avoid duplicates
  window.addEventListener("beforeunload", handlePageUnload);

  // SPA navigation tracking
  let currentUrl = window.location.href;

  const handleRouteChange = () => {
    const newUrl = window.location.href;
    if (newUrl !== currentUrl) {
      console.log("🔄 Bklit SDK: Route change detected", {
        from: currentUrl,
        to: newUrl,
        sessionId: currentSessionId,
      });
      currentUrl = newUrl;
      trackPageView(); // Track the new page view
    }
  };

  // Listen for popstate (browser back/forward)
  window.addEventListener("popstate", handleRouteChange);

  // Override pushState and replaceState for SPA navigation
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = (...args) => {
    originalPushState.apply(history, args);
    setTimeout(handleRouteChange, 0);
  };

  history.replaceState = (...args) => {
    originalReplaceState.apply(history, args);
    setTimeout(handleRouteChange, 0);
  };

  console.log("🎯 Bklit SDK: SPA navigation tracking enabled");
}

// Helper function to generate a unique session ID
function generateSessionId(): string {
  // Generate a unique session ID based on timestamp and random number
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}

// Global function for manual page view tracking
export function trackPageView() {
  if (typeof window === "undefined") {
    console.warn(
      "❌ Bklit SDK: trackPageView can only be called in browser environment"
    );
    return;
  }

  if (!currentSessionId) {
    console.warn("❌ Bklit SDK: No active session. Call initBklit() first.");
    return;
  }

  console.log("🎯 Bklit SDK: Manual page view tracking triggered");

  // Call the internal trackPageView function
  // We need to recreate it here since it's scoped inside initBklit
  const data = {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    siteId: window.bklitSiteId || "unknown",
    userAgent: navigator.userAgent,
    sessionId: currentSessionId,
    referrer: document.referrer || undefined,
  };

  console.log("🚀 Bklit SDK: Manual page view tracking...", {
    url: data.url,
    sessionId: data.sessionId,
    siteId: data.siteId,
  });

  const apiHost = window.bklitApiHost || DEFAULT_API_HOST;

  fetch(apiHost, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    keepalive: true,
  })
    .then((response) => {
      if (response.ok) {
        console.log("✅ Bklit SDK: Manual page view tracked successfully!", {
          url: data.url,
          sessionId: data.sessionId,
          status: response.status,
        });
      } else {
        console.error("❌ Bklit SDK: Failed to track manual page view", {
          status: response.status,
          statusText: response.statusText,
        });
      }
    })
    .catch((error) => {
      console.error("❌ Bklit SDK: Error tracking manual page view:", error);
    });
}

// Store configuration globally for manual tracking
declare global {
  interface Window {
    trackPageView?: () => void;
    bklitSiteId?: string;
    bklitApiHost?: string;
  }
}

// Make trackPageView available globally
window.trackPageView = trackPageView;
