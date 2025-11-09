(() => {
  const INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes
  let inactivityTimer = null;
  let sessionEnded = false;

  // Get config from script tag
  const currentScript =
    document.currentScript || document.querySelector("script[data-project-id]");
  const projectId = currentScript?.getAttribute("data-project-id");
  const apiToken = currentScript?.getAttribute("data-token");
  
  // Smart API URL detection: use data-api-url attribute, or detect from hostname
  let apiUrl = currentScript?.getAttribute("data-api-url");
  if (!apiUrl) {
    // Auto-detect based on current hostname
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      apiUrl = "http://localhost:3000";
    } else {
      apiUrl = "https://app.bklit.com";
    }
  }

  if (!projectId) {
    console.error("[Bklit] Error: data-project-id attribute is required");
    return;
  }

  if (!apiToken) {
    console.error("[Bklit] Error: data-token attribute is required");
    return;
  }

  // Utility: Get or generate a sessionId
  function getSessionId() {
    let sessionId = localStorage.getItem("bklit_session_id");
    if (!sessionId) {
      sessionId = Math.random().toString(36).slice(2) + Date.now();
      localStorage.setItem("bklit_session_id", sessionId);
    }
    return sessionId;
  }

  // End session API call
  async function endSession() {
    if (sessionEnded) return;
    sessionEnded = true;
    const sessionId = getSessionId();
    try {
      await fetch(`${apiUrl}/api/track/session-end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ sessionId, projectId }),
        keepalive: true, // for beforeunload
      });
      // Optionally clear sessionId if you want new session next visit
      // localStorage.removeItem('bklit_session_id');
    } catch {
      // Silent fail
    }
  }

  // Reset inactivity timer
  function resetInactivityTimer() {
    if (sessionEnded) return;
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(endSession, INACTIVITY_TIMEOUT_MS);
  }

  // Track page view (existing logic)
  async function trackPageView() {
    try {
      const data = {
        url: window.location.href,
        timestamp: new Date().toISOString(),
        projectId: projectId,
        sessionId: getSessionId(),
        userAgent: navigator.userAgent,
        referrer: document.referrer || undefined,
      };

      // Extract UTM parameters
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("utm_source"))
        data.utmSource = urlParams.get("utm_source");
      if (urlParams.get("utm_medium"))
        data.utmMedium = urlParams.get("utm_medium");
      if (urlParams.get("utm_campaign"))
        data.utmCampaign = urlParams.get("utm_campaign");
      if (urlParams.get("utm_term")) data.utmTerm = urlParams.get("utm_term");
      if (urlParams.get("utm_content"))
        data.utmContent = urlParams.get("utm_content");

      await fetch(`${apiUrl}/api/track`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.error("[Bklit] Tracking error:", err);
    }
  }
  window.trackPageView = trackPageView;

  // --- SPA Navigation Tracking ---
  // Helper to wrap history methods
  function wrapHistoryMethod(type) {
    const orig = history[type];
    return function () {
      const rv = orig.apply(this, args);
      window.dispatchEvent(new Event(type));
      return rv;
    };
  }
  history.pushState = wrapHistoryMethod("pushState");
  history.replaceState = wrapHistoryMethod("replaceState");

  // Listen for all navigation events
  window.addEventListener("popstate", trackPageView);
  window.addEventListener("pushState", trackPageView);
  window.addEventListener("replaceState", trackPageView);

  // User activity events
  ["mousemove", "keydown", "scroll", "touchstart", "visibilitychange"].forEach(
    (event) => {
      window.addEventListener(event, resetInactivityTimer, { passive: true });
    },
  );

  // End session on tab close
  window.addEventListener("beforeunload", endSession);

  // Start tracking
  trackPageView();
  resetInactivityTimer();
})();
