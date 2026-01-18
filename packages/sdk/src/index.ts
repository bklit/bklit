// packages/bklit-sdk/src/index.ts

import { type BklitConfig, getDefaultConfig, validateConfig } from "./config";

interface BklitOptions {
  projectId: string;
  wsHost?: string;
  environment?: "development" | "production";
  debug?: boolean;
  apiKey?: string;
}

let ws: WebSocket | null = null;
let currentSessionId: string | null = null;
let lastTrackedUrl: string | null = null;
let lastTrackedTime = 0;
let reconnectAttempts = 0;
let isReconnecting = false;
const messageQueue: Record<string, unknown>[] = [];

const TRACKING_DEBOUNCE_MS = 1000;
const SESSION_STORAGE_KEY = "bklit_session_id";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY = 1000; // 1 second

// Classify referrer into categories
function classifyReferrer(hostname: string): string {
  if (!hostname) {
    return "direct";
  }

  const searchEngines = [
    "google",
    "bing",
    "yahoo",
    "duckduckgo",
    "baidu",
    "yandex",
  ];
  if (searchEngines.some((engine) => hostname.includes(engine))) {
    return "organic";
  }

  const socialPlatforms = [
    "facebook",
    "twitter",
    "linkedin",
    "instagram",
    "pinterest",
    "reddit",
    "tiktok",
    "youtube",
  ];
  if (socialPlatforms.some((platform) => hostname.includes(platform))) {
    return "social";
  }

  return "referral";
}

// Generate or retrieve session ID
function getOrCreateSessionId(): string {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const { id, timestamp } = JSON.parse(stored);
      const now = Date.now();
      if (now - timestamp < SESSION_TIMEOUT_MS) {
        currentSessionId = id;
        return id;
      }
    }
  } catch {
    // Ignore sessionStorage errors
  }

  // Generate new session ID
  const sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  currentSessionId = sessionId;

  try {
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ id: sessionId, timestamp: Date.now() })
    );
  } catch {
    // Ignore sessionStorage errors
  }

  return sessionId;
}

// Send message over WebSocket with queuing
function sendMessage(message: Record<string, unknown>, debug = false): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
    if (debug) {
      console.log("🚀 Bklit SDK: Message sent via WebSocket", message.type);
    }
  } else {
    // Queue message for when connection is established
    messageQueue.push(message);
    if (debug) {
      console.log(
        "📦 Bklit SDK: Message queued (WebSocket not ready)",
        message.type
      );
    }
  }
}

// Flush queued messages
function flushQueue(debug = false): void {
  if (ws && ws.readyState === WebSocket.OPEN && messageQueue.length > 0) {
    if (debug) {
      console.log(
        `📤 Bklit SDK: Flushing ${messageQueue.length} queued messages`
      );
    }
    while (messageQueue.length > 0) {
      const message = messageQueue.shift();
      ws.send(JSON.stringify(message));
    }
  }
}

// Initialize WebSocket connection
function initWebSocket(
  projectId: string,
  sessionId: string,
  wsHost: string,
  apiKey: string | undefined,
  debug: boolean
): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    if (debug) {
      console.log("✅ Bklit SDK: WebSocket already connected");
    }
    return;
  }

  if (isReconnecting) {
    return; // Avoid multiple reconnection attempts
  }

  const url = `${wsHost}?projectId=${projectId}&sessionId=${sessionId}`;

  if (debug) {
    console.log("🔌 Bklit SDK: Connecting to WebSocket", url);
  }

  ws = new WebSocket(url);

  ws.onopen = () => {
    reconnectAttempts = 0;
    isReconnecting = false;

    if (debug) {
      console.log("✅ Bklit SDK: WebSocket connected");
    }

    // Send authentication if API key provided
    if (apiKey) {
      sendMessage({ type: "auth", apiKey }, debug);
    }

    // Flush any queued messages
    flushQueue(debug);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (debug) {
        console.log("📨 Bklit SDK: Received message", data.type);
      }

      // Handle different message types
      if (data.type === "connected" && debug) {
        console.log("🎯 Bklit SDK: Connection confirmed", data);
      } else if (data.type === "ack" && debug) {
        console.log("✅ Bklit SDK: Event acknowledged", data.messageType);
      } else if (data.type === "auth_success" && debug) {
        console.log("🔐 Bklit SDK: Authentication successful");
      }
    } catch (error) {
      console.error("❌ Bklit SDK: Error parsing message", error);
    }
  };

  ws.onerror = (error) => {
    console.error("❌ Bklit SDK: WebSocket error", error);
  };

  ws.onclose = () => {
    if (debug) {
      console.log("🔌 Bklit SDK: WebSocket disconnected");
    }

    // Don't reconnect if page is unloading
    if (document.visibilityState === "hidden") {
      return;
    }

    // Attempt reconnection with exponential backoff
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      isReconnecting = true;
      const delay = RECONNECT_BASE_DELAY * 2 ** reconnectAttempts;
      reconnectAttempts++;

      if (debug) {
        console.log(
          `🔄 Bklit SDK: Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`
        );
      }

      setTimeout(() => {
        isReconnecting = false;
        initWebSocket(projectId, sessionId, wsHost, apiKey, debug);
      }, delay);
    } else {
      console.error(
        "❌ Bklit SDK: Max reconnection attempts reached. Events will be queued."
      );
    }
  };
}

export function initBklit(options: BklitOptions): void {
  if (typeof window === "undefined") {
    return;
  }

  const { projectId, wsHost, environment, debug, apiKey } = options;

  // Determine values: use provided options, fall back to defaults only if needed
  const finalEnvironment = environment || "production";
  const finalDebug =
    debug !== undefined ? debug : finalEnvironment === "development";

  // Only get default wsHost if not provided
  const finalWsHost = wsHost || getDefaultConfig(finalEnvironment).wsHost;

  const finalConfig: BklitConfig = {
    wsHost: finalWsHost,
    environment: finalEnvironment,
    debug: finalDebug,
  };

  // Validate configuration
  validateConfig(finalConfig);

  if (!projectId) {
    console.error("❌ Bklit SDK: projectId is required for initialization.");
    return;
  }

  if (finalConfig.debug) {
    console.log("🎯 Bklit SDK: Initializing with configuration", {
      projectId,
      wsHost: finalConfig.wsHost,
      environment: finalConfig.environment,
      debug: finalConfig.debug,
      hasApiKey: !!apiKey,
      userAgent: `${navigator.userAgent.substring(0, 50)}...`,
    });
  }

  // Store configuration globally for manual tracking
  window.bklitprojectId = projectId;
  window.bklitWsHost = finalConfig.wsHost;
  window.bklitEnvironment = finalConfig.environment;
  window.bklitDebug = finalConfig.debug;
  window.bklitApiKey = apiKey;

  // Get or create session ID
  const sessionId = getOrCreateSessionId();

  if (finalConfig.debug) {
    console.log("🔑 Bklit SDK: Session ID", sessionId);
  }

  // Initialize WebSocket connection
  initWebSocket(
    projectId,
    sessionId,
    finalConfig.wsHost,
    apiKey,
    finalConfig.debug
  );

  // Track initial pageview
  trackPageView();

  // Track navigation changes
  let previousUrl = window.location.href;

  const handleUrlChange = () => {
    const currentUrl = window.location.href;
    if (currentUrl !== previousUrl) {
      previousUrl = currentUrl;
      trackPageView();
    }
  };

  // Listen for popstate (back/forward button)
  window.addEventListener("popstate", handleUrlChange);

  // Listen for hashchange
  window.addEventListener("hashchange", handleUrlChange);

  // Intercept pushState and replaceState
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    handleUrlChange();
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    handleUrlChange();
  };

  // Expose global functions
  window.bklit = {
    trackPageView,
    trackEvent,
  };

  if (finalConfig.debug) {
    console.log("✅ Bklit SDK: Initialization complete");
    console.log("📊 Bklit SDK: Auto-tracking enabled for page views");
    console.log(
      "🎯 Bklit SDK: Use window.bklit.trackEvent() for custom events"
    );
  }
}

// Track page view
export function trackPageView(): void {
  if (typeof window === "undefined") {
    return;
  }

  const projectId = window.bklitprojectId;
  const debug = window.bklitDebug;

  if (!projectId) {
    console.warn(
      "❌ Bklit SDK: No projectId configured. Call initBklit() first."
    );
    return;
  }

  const currentUrl = window.location.href;
  const now = Date.now();

  // Debounce tracking
  if (
    currentUrl === lastTrackedUrl &&
    now - lastTrackedTime < TRACKING_DEBOUNCE_MS
  ) {
    if (debug) {
      console.log("⏭️ Bklit SDK: Skipping duplicate pageview (debounced)");
    }
    return;
  }

  lastTrackedUrl = currentUrl;
  lastTrackedTime = now;

  // Get referrer information
  const referrer = document.referrer;
  const referrerHostname = referrer ? new URL(referrer).hostname : "";
  const currentHostname = window.location.hostname;

  // Determine referrer type
  let referrerType = "direct";
  if (referrerHostname) {
    referrerType =
      referrerHostname === currentHostname
        ? "internal"
        : classifyReferrer(referrerHostname);
  }

  const data = {
    url: currentUrl,
    timestamp: new Date().toISOString(),
    referrer: referrer || null,
    referrerHostname: referrerHostname || null,
    referrerType,
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    screen: {
      width: window.screen.width,
      height: window.screen.height,
    },
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    sessionId: currentSessionId,
    projectId,

    // Session tracking
    isNewVisitor: !localStorage.getItem("bklit_has_visited"),
    landingPage: sessionStorage.getItem("bklit_landing_page") || currentUrl,
  };

  // Mark as visited
  if (!localStorage.getItem("bklit_has_visited")) {
    localStorage.setItem("bklit_has_visited", "true");
  }

  // Store landing page
  if (!sessionStorage.getItem("bklit_landing_page")) {
    sessionStorage.setItem("bklit_landing_page", currentUrl);
  }

  if (debug) {
    console.log("🚀 Bklit SDK: Tracking page view...", {
      url: data.url,
      sessionId: data.sessionId,
      projectId: data.projectId,
    });
  }

  sendMessage(
    {
      type: "pageview",
      data,
      apiKey: window.bklitApiKey,
    },
    debug
  );
}

// Track custom event
export function trackEvent(
  trackingId: string,
  eventType: string,
  metadata?: Record<string, unknown>,
  triggerMethod?: "automatic" | "manual"
): void {
  if (typeof window === "undefined") {
    console.warn(
      "❌ Bklit SDK: trackEvent can only be called in browser environment"
    );
    return;
  }

  const projectId = window.bklitprojectId;
  const debug = window.bklitDebug;

  if (!projectId) {
    console.warn(
      "❌ Bklit SDK: No projectId configured. Call initBklit() first."
    );
    return;
  }

  const data = {
    trackingId,
    eventType,
    timestamp: new Date().toISOString(),
    metadata: {
      ...metadata,
      triggerMethod: triggerMethod || "manual",
    },
    projectId,
    sessionId: currentSessionId || undefined,
  };

  if (debug) {
    console.log("🎯 Bklit SDK: Tracking event...", {
      trackingId: data.trackingId,
      eventType: data.eventType,
      projectId: data.projectId,
      sessionId: data.sessionId,
    });
  }

  sendMessage(
    {
      type: "event",
      data,
      apiKey: window.bklitApiKey,
    },
    debug
  );
}

// Type declarations for window
declare global {
  interface Window {
    bklitprojectId?: string;
    bklitWsHost?: string;
    bklitEnvironment?: string;
    bklitDebug?: boolean;
    bklitApiKey?: string;
    initBklit: typeof initBklit;
    bklit: {
      trackPageView: typeof trackPageView;
      trackEvent: typeof trackEvent;
    };
  }
}
