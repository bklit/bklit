# Slack Extension

Send real-time analytics events to your Slack workspace channels.

## Setup Guide

<Steps>
<Step>

### Create an Incoming Webhook in Slack

1. Go to your Slack workspace
2. Visit [Slack App Directory](https://api.slack.com/messaging/webhooks)
3. Click **"Create New App"** → **"From scratch"**
4. Name it "Bklit Analytics" and select your workspace
5. Click **"Incoming Webhooks"** in the sidebar
6. Toggle **"Activate Incoming Webhooks"** to On
7. Click **"Add New Webhook to Workspace"**
8. Select the channel (e.g., `#analytics`)
9. Click **"Allow"**
10. Copy the **Webhook URL**
    - Format: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`

</Step>

<Step>

### Activate in Bklit

1. Navigate to Extensions in your Bklit dashboard
2. Find the Slack extension
3. Click **"Activate"**
4. Select which projects should use Slack notifications
5. Go to your project's settings → Extensions
6. Click **"Configure"** on Slack

</Step>

<Step>

### Configure

1. **Paste your Slack webhook URL**
2. **Select which custom events** you want forwarded to Slack
3. Click **"Save Configuration"**
4. Click **"Test"** to verify it works
5. Toggle to **"Active"**

</Step>
</Steps>

## How It Works

Whenever a selected custom event is triggered on your website, Slack receives a formatted notification.

### Example Event

When someone on your site triggers:

```javascript
window.trackEvent("purchase", "completed", {
  plan: "Pro",
  amount: "$29",
  userId: "user-123",
});
```

Slack receives a formatted Block Kit message:

```text
🎯 purchase
Event: completed

plan: Pro
amount: $29
userId: user-123

Project ID: your-project-id • Jan 5, 2025, 2:30 PM
```

## Event Filtering

**Note:** "View" events are automatically filtered out to prevent spam. The Slack extension only forwards:
- Click events
- Custom events (purchase, signup, etc.)
- Other interaction events

Pageview events are excluded since they can generate thousands of notifications per day.

## Rate Limiting

- **Global limit:** 1,000 events per hour across all Slack extensions
- Events exceeding the limit are silently skipped
- Limit resets every hour

## Multiple Channels

To send different events to different Slack channels:

1. Create webhooks for each channel in Slack
2. Activate Slack extension multiple times (coming soon)
3. Configure each with different webhook URLs and events

**Current:** Each project supports one Slack webhook  
**Future:** Multiple webhook configurations per project

## Troubleshooting

**Messages not appearing?**
- Verify webhook URL is correct
- Check extension is enabled (toggle)
- Ensure events are selected
- Use "Test" button to debug
- Check Slack app permissions

**Rate limit hit?**
- Wait for next hour
- Consider filtering which events to forward
- Contact support for increased limits (Pro plan)

## Security

- Webhook URLs are encrypted in database
- Never share your webhook URL publicly
- Regenerate webhook if compromised
- Bklit never stores message content

## Slack API Documentation

- [Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [Block Kit Builder](https://app.slack.com/block-kit-builder)
- [Message Formatting](https://api.slack.com/reference/surfaces/formatting)

## Support

Need help? Contact support@bklit.com or check our documentation.

