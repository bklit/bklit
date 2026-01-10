# GitHub Deployments

Track GitHub Actions workflow deployments and see them on your analytics charts.

## Setup Guide

<Steps>
<Step>

### Link Your GitHub Account

1. Navigate to Extensions in your Bklit dashboard
2. Find the GitHub Deployments extension
3. Click **"Activate"** and select your project
4. Go to your project's settings → Extensions
5. Click **"Link GitHub Account"**
6. Authorize Bklit to access your GitHub workflows

</Step>

<Step>

### Configure

1. **Select Repository** - Choose which repo to track
2. **Select Production Workflows** - Pick workflows that deploy to production (e.g., "Deploy to Production", "Release")
3. **Set Production Branch** - Usually `main` or `master`
4. Click **"Setup GitHub Webhook"** - Automatically creates the webhook in your repo

</Step>

<Step>

### Deploy!

Whenever a selected workflow completes successfully on your production branch, the deployment will be tracked in Bklit.

</Step>
</Steps>

## How It Works

When a GitHub Actions workflow completes:
1. GitHub sends a webhook to Bklit
2. We check if it matches your configured workflows and branch
3. If yes, create a deployment record with commit info
4. (Coming soon) Deployment markers appear on your analytics charts
5. (Coming soon) Compare metrics before/after each deployment

## What's Tracked

For each successful workflow run:
- Commit SHA and message
- Branch name
- Author and avatar
- Workflow run URL
- Timestamp

## Event Filtering

Only workflows you select are tracked, and only on your production branch. This prevents noise from PR deployments and other branches.

## Troubleshooting

**Deployments not appearing?**
- Verify webhook was created in GitHub repo settings
- Check selected workflows are correct
- Ensure production branch matches
- Deploy and check your database (`pnpm db:studio` → deployment table)

**No repositories showing?**
- Make sure you linked your GitHub account
- GitHub OAuth needs repo access scope

## Security

- Webhook requests are verified with secret
- Only tracks workflows you explicitly select
- No sensitive data stored

## Support

Need help? Contact support@bklit.com or check our documentation.

