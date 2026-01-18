# @bklit/sdk Changelog

## [1.0.1] - 2026-01-18

### 🐛 Bug Fixes

**Critical fix for production WebSocket connections:**

- **Fixed default WebSocket URL** - Now correctly defaults to `wss://bklit.ws:8080` instead of `wss://bklit.ws`
- **Impact:** v1.0.0 users couldn't connect without manually specifying `wsHost`
- **Action:** Update to v1.0.1 immediately if using default configuration

**Who should upgrade:**
- Anyone using v1.0.0 without explicitly setting `wsHost`
- If you're seeing WebSocket connection errors in console
- If events aren't tracking after upgrading to v1.0.0

**No code changes needed** - just update:
```bash
npm install @bklit/sdk@latest
```

---

## [1.0.0] - 2026-01-18

### 🚀 Major Release - WebSocket Architecture

**Breaking Changes:**

- **Replaced HTTP with WebSocket** for all event tracking
  - SDK now establishes persistent WebSocket connection
  - No more HTTP POST requests to `/api/track`
  - Configuration changed: `apiHost` → `wsHost`

**Migration Guide:**

```javascript
// Before (v0.x)
initBklit({
  projectId: "...",
  apiKey: "...",
  apiHost: "https://app.bklit.com/api/track"
});

// After (v1.0.0)
initBklit({
  projectId: "...",
  apiKey: "...",
  wsHost: "wss://bklit.ws:8080"  // Optional - auto-detected
});
```

**New Features:**

- ✅ **Instant session ending** - Sessions end in <1 second when browser tab closes
- ✅ **Auto-reconnection** - Exponential backoff reconnection on disconnect
- ✅ **Message queuing** - Events queued when WebSocket not ready
- ✅ **Better reliability** - Browser handles WebSocket cleanup automatically
- ✅ **Production WebSocket** - Secure wss:// with TLS/SSL support

**Removed:**

- ❌ All `beforeunload`/`pagehide` event handlers
- ❌ `endSession()` function (automatic on disconnect now)
- ❌ `navigator.sendBeacon()` fallbacks
- ❌ HTTP fetch calls for tracking

**Performance:**

- **Session end latency:** 30s-4min → <1 second (120-240x faster)
- **Bundle size:** ~12KB (unchanged - efficient WebSocket implementation)
- **Real-time updates:** Instant via WebSocket broadcast

**Infrastructure:**

- Production: `wss://bklit.ws:8080`
- Development: `ws://localhost:8080`
- Falls back gracefully if connection fails

---

## [0.3.0] - Previous release

Earlier versions used HTTP-based tracking.

