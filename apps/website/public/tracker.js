(() => {
  const INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes
  let inactivityTimer = null;
  let sessionEnded = false;

  // Auto-detect API URL based on hostname
  const hostname = window.location.hostname;
  const apiUrl =
    hostname === "localhost" || hostname === "127.0.0.1"
      ? "http://localhost:3000"
      : "https://app.bklit.com";

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
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
        siteId: "YOUR_SITE_ID_HERE",
        sessionId: getSessionId(),
      };
      await fetch(`${apiUrl}/api/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      // Silent fail
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
