# Bklit Analytics SDK

A lightweight analytics SDK for tracking page views, sessions, and user behavior.

## Installation

```bash
npm install @bklit/sdk
# or
pnpm add @bklit/sdk
```

## Quick Start

```javascript
import { initBklit } from "@bklit/sdk";

// Initialize the SDK
initBklit({
  projectId: "your-project-id",
  apiKey: "your-api-key",
  debug: true, // Optional - enables console logging
});
```

Get your `projectId` and `apiKey` from your [Bklit Dashboard](https://app.bklit.com).

## Configuration Options

### `initBklit(options)`

**Required Parameters:**

- `projectId` (string) - Your unique project identifier from the Bklit dashboard
- `apiKey` (string) - Your API authentication token from the Bklit dashboard

**Optional Parameters:**

- `apiHost` (string) - API endpoint URL. Defaults to `https://app.bklit.com/api/track`
- `environment` (string) - Set to `"development"` for local testing. Defaults to `"production"`
- `debug` (boolean) - Enable detailed console logging. Defaults to `false`

### Example with All Options

```javascript
initBklit({
  projectId: "your-project-id",
  apiKey: "your-api-key",
  apiHost: "https://app.bklit.com/api/track", // Optional
  environment: "production", // Optional
  debug: false, // Optional
});
```

## Console Logging

When `debug: true` is enabled, the SDK provides detailed console logs to help you monitor tracking events.

**Note:** Error messages (using `console.error` and `console.warn`) will always appear regardless of the debug setting.

### Example Debug Output

```
🎯 Bklit SDK: Initializing with configuration {
  projectId: "your-project-id",
  apiHost: "https://app.bklit.com/api/track",
  environment: "production",
  debug: true
}

🆔 Bklit SDK: New session created {
  sessionId: "1703123456789-abc123def456"
}

🚀 Bklit SDK: Tracking page view... {
  url: "https://yoursite.com/page",
  sessionId: "1703123456789-abc123def456",
  projectId: "your-project-id"
}

✅ Bklit SDK: Page view tracked successfully!
```

## Features

### Automatic Tracking

- **Page View Tracking** - Automatically tracks when pages load
- **Session Management** - Creates and manages user sessions across page visits
- **SPA Support** - Detects route changes in single-page applications
- **Session Ending** - Automatically ends sessions when users close the tab

### Event Tracking

Track user interactions automatically with data attributes or IDs:

```html
<!-- Using data attribute -->
<button data-bklit-event="cta-signup">Sign Up</button>

<!-- Using ID -->
<button id="bklit-event-cta-login">Login</button>
```

The SDK automatically tracks:

- **Click events** - When users click the element
- **View events** - When the element becomes visible (50% threshold)
- **Hover events** - When users hover for 500ms

### Manual Tracking

#### Track Page Views

```javascript
window.trackPageView();
```

Useful for custom routing or manual page tracking.

#### Track Custom Events

```javascript
window.trackEvent(
  "purchase-button", // trackingId
  "click", // eventType: "click", "view", "hover", or custom
  {
    // metadata (optional)
    product: "Pro Plan",
    price: 29.99,
  },
  "manual", // triggerMethod: "automatic" or "manual"
);
```

### UTM Parameter Tracking

The SDK automatically captures UTM parameters from the URL:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_term`
- `utm_content`

These are included with every page view event.

## API Reference

### `initBklit(options)`

Initialize the Bklit SDK.

**Parameters:**

- `options.projectId` (string, **required**) - Your unique project identifier
- `options.apiKey` (string, **required**) - Your API authentication token
- `options.apiHost` (string, optional) - API endpoint URL. Defaults to `https://app.bklit.com/api/track`
- `options.environment` (string, optional) - Environment mode: `"development"` or `"production"`. Defaults to `"production"`
- `options.debug` (boolean, optional) - Enable debug logging. Defaults to `false`

### `window.trackPageView()`

Manually trigger a page view tracking event.

**Returns:** void

### `window.trackEvent(trackingId, eventType, metadata?, triggerMethod?)`

Manually trigger a custom event.

**Parameters:**

- `trackingId` (string, required) - Unique identifier for the event
- `eventType` (string, required) - Type of event: `"click"`, `"view"`, `"hover"`, or custom
- `metadata` (object, optional) - Additional data to attach to the event
- `triggerMethod` (string, optional) - `"automatic"` or `"manual"`. Defaults to `"manual"`

**Returns:** void

### `window.clearBklitSession()`

Clear the current session (useful for testing).

**Returns:** void

## Support

- **Documentation:** [https://bklit.com](https://bklit.com)
- **Issues:** [https://github.com/bklit/bklit/issues](https://github.com/bklit/bklit/issues)
- **Discord:** [https://discord.gg/GFfD67gZGf](https://discord.gg/GFfD67gZGf)

## License

MIT
