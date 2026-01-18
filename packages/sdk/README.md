# Bklit Analytics SDK

A lightweight analytics SDK for tracking page views, sessions, and user behavior via WebSocket.

> **⚠️ Upgrading from v0.x?** See the [Migration Guide](#migrating-from-v0x) below.

## Installation

```bash
npm install @bklit/sdk
# or
pnpm add @bklit/sdk
```

## Quick Start

### Vanilla JavaScript / React

```javascript
import { initBklit } from "@bklit/sdk";

initBklit({
  projectId: "your-project-id",
  apiKey: "your-api-key",
  debug: true, // Optional - enables console logging
});
```

### Next.js

For Next.js applications, use the `BklitComponent`:

```tsx
import { BklitComponent } from "@bklit/sdk/nextjs";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <BklitComponent
          projectId="your-project-id"
          apiKey="your-api-key"
          debug={process.env.NODE_ENV === "development"}
        />
        {children}
      </body>
    </html>
  );
}
```

Get your `projectId` and `apiKey` from your [Bklit Dashboard](https://app.bklit.com).

## Configuration Options

### `BklitComponent` (Next.js)

**Props:**

- `projectId` (string, **required**) - Your unique project identifier
- `apiKey` (string, optional) - Your API authentication token
- `wsHost` (string, optional) - WebSocket server URL. Defaults to `wss://bklit.ws` in production, `ws://localhost:8080` in development
- `environment` (string, optional) - Environment mode: `"development"` or `"production"`. Defaults to `"production"`
- `debug` (boolean, optional) - Enable debug logging. Defaults to `false`

### `initBklit(options)`

**Required Parameters:**

- `projectId` (string) - Your unique project identifier from the Bklit dashboard
- `apiKey` (string) - Your API authentication token from the Bklit dashboard

**Optional Parameters:**

- `wsHost` (string) - WebSocket server URL. Defaults to `wss://bklit.ws` in production, `ws://localhost:8080` in development
- `environment` (string) - Set to `"development"` for local testing. Defaults to `"production"`
- `debug` (boolean) - Enable detailed console logging. Defaults to `false`

### Example with All Options

```javascript
initBklit({
  projectId: "your-project-id",
  apiKey: "your-api-key",
  wsHost: "wss://bklit.ws", // Optional - auto-detected
  environment: "production", // Optional
  debug: false, // Optional
});
```

## How It Works

The SDK establishes a WebSocket connection to track analytics in real-time:

1. **Persistent Connection** - Opens WebSocket to `wss://bklit.ws` on initialization
2. **Automatic Tracking** - Sends pageviews and navigation events over WebSocket
3. **Instant Session End** - Sessions end automatically when the browser tab closes (WebSocket disconnect)
4. **Auto-Reconnect** - Reconnects automatically with exponential backoff if connection drops
5. **Message Queuing** - Queues events when connection is not ready

## API Reference

### `trackPageView()`

Manually track a page view. Usually not needed as the SDK auto-tracks navigation.

```javascript
import { trackPageView } from "@bklit/sdk";

trackPageView();
```

### `trackEvent(trackingId, eventType, metadata, triggerMethod)`

Track custom events like button clicks, form submissions, etc.

```javascript
import { trackEvent } from "@bklit/sdk";

trackEvent(
  "cta-button", // tracking ID
  "click", // event type
  { buttonText: "Sign Up", position: "hero" }, // metadata (optional)
  "automatic" // trigger method (optional)
);
```

## Console Logging

When `debug: true` is enabled, the SDK provides detailed console logs:

- `🔌 Bklit SDK: Connecting to WebSocket`
- `✅ Bklit SDK: WebSocket connected`
- `🚀 Bklit SDK: Message sent via WebSocket`
- `📦 Bklit SDK: Message queued (WebSocket not ready)`
- `🔄 Bklit SDK: Reconnecting...`

Error messages (using `console.error` and `console.warn`) always appear regardless of the debug setting.

## Architecture

```
Browser SDK → WebSocket (wss://bklit.ws) → Queue → ClickHouse
     ↓                                         ↓
Auto-reconnect                          Real-time Dashboard
```

- **Sub-second latency** for real-time analytics
- **Instant session tracking** - Sessions appear/disappear immediately
- **Reliable** - Browser handles WebSocket cleanup automatically

## Migrating from v0.x

### Breaking Changes in v1.0.0

v1.0.0 migrates from HTTP to WebSocket architecture. This requires a configuration change:

**Before (v0.x):**
```javascript
import { initBklit } from "@bklit/sdk";

initBklit({
  projectId: "your-project-id",
  apiKey: "your-api-key",
  apiHost: "https://app.bklit.com/api/track",  // ❌ No longer used
});
```

**After (v1.0.0):**
```javascript
import { initBklit } from "@bklit/sdk";

initBklit({
  projectId: "your-project-id",
  apiKey: "your-api-key",
  wsHost: "wss://bklit.ws:8080",  // Optional - auto-detected in most cases
});
```

**Or simplest (recommended):**
```javascript
initBklit({
  projectId: "your-project-id",
  apiKey: "your-api-key",
  // wsHost auto-detected based on environment
});
```

### For Next.js Apps

**Before (v0.x):**
```tsx
<BklitComponent
  projectId="..."
  apiKey="..."
  apiHost="https://app.bklit.com/api/track"  // ❌ Remove this
/>
```

**After (v1.0.0):**
```tsx
<BklitComponent
  projectId="..."
  apiKey="..."
  wsHost="wss://bklit.ws:8080"  // Optional - auto-detected
/>
```

**Or simplest:**
```tsx
<BklitComponent
  projectId="..."
  apiKey="..."
  // wsHost auto-detected
/>
```

### What Changed

- ✅ **HTTP → WebSocket:** Persistent connection instead of HTTP requests
- ✅ **Instant session ending:** <1 second instead of 30s-4min
- ✅ **Auto-reconnection:** Handles network issues gracefully
- ✅ **Removed:** `endSession()` function (automatic now)

### Need Help?

See the full [CHANGELOG](https://github.com/bklit/bklit/blob/main/packages/sdk/CHANGELOG.md) or [open an issue](https://github.com/bklit/bklit/issues).

## License

MIT
