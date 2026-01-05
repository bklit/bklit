# Discord Extension

Send real-time analytics events to your Discord server channels.

## Setup Guide

### Step 1: Create a Webhook in Discord

1. Open your Discord server
2. Go to the channel where you want notifications (e.g., `#analytics`)
3. Click the gear icon (Edit Channel)
4. Go to **Integrations** → **Webhooks**
5. Click **"New Webhook"** or **"Create Webhook"**
6. Configure the webhook:
   - **Name:** "Bklit Analytics" (or your preference)
   - **Channel:** Select which channel to post to
   - **Avatar:** Optional - add a Bklit logo
7. Click **"Copy Webhook URL"**
   - Format: `https://discord.com/api/webhooks/123456789/abcdefghijklmnopqrstuvwxyz`

### Step 2: Activate in Bklit

1. Click **"Activate"** on this page
2. Select which projects should use Discord notifications
3. Navigate to your project's settings → Extensions
4. Click **"Configure"** on Discord

### Step 3: Configure

1. **Paste your Discord webhook URL**
2. **Select which custom events** you want forwarded to Discord
3. Click **"Save Configuration"**
4. Click **"Test"** to verify it works
5. Toggle to **"Active"**

## How It Works

Whenever a selected custom event is triggered on your website, Discord receives a formatted notification.

### Example Event

When someone on your site triggers:

```javascript
window.trackEvent('purchase', 'completed', {
  plan: 'Pro',
  amount: '$29',
  userId: 'user-123'
});
```

Discord receives:

```
🎯 purchase
Event: completed

plan: Pro
amount: $29
userId: user-123

Project ID: your-project-id
```

## Event Filtering

**Note:** "View" events are automatically filtered out to prevent spam. The Discord extension only forwards:
- Click events
- Custom events (purchase, signup, etc.)
- Other interaction events

Pageview events are excluded since they can generate thousands of notifications per day.

## Multiple Channels

To send different events to different Discord channels:

1. Create webhooks for each channel in Discord
2. Activate Discord extension multiple times (coming soon)
3. Configure each with different webhook URLs and events

**Current:** Each project supports one Discord webhook  
**Future:** Multiple webhook configurations per project

## Rate Limiting

- **Global limit:** 1,000 events per hour across all Discord extensions
- Events exceeding the limit are silently skipped
- Limit resets every hour

## Troubleshooting

**Messages not appearing?**
- Verify webhook URL is correct
- Check extension is enabled (toggle)
- Ensure events are selected
- Use "Test" button to debug

**Rate limit hit?**
- Wait for next hour
- Consider filtering which events to forward
- Contact support for increased limits (Pro plan)

## Security

- Webhook URLs are encrypted in database
- Never share your webhook URL publicly
- Regenerate webhook if compromised
- Bklit never stores message content

## Support

Need help? Contact support@bklit.com or check our documentation.

