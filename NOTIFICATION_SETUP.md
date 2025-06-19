# Push Notification Setup (Simplified)

This guide sets up push notifications using Netlify Functions + external cron jobs.

## What You Need

- ✅ VAPID keys (already generated)
- ✅ Netlify environment variables (already set)
- 🔄 Netlify function (ready to deploy)
- 🔄 External cron job (next step)

## Next Steps

### 1. Deploy Your Code

Push your code to GitHub. Netlify will automatically deploy the function.

### 2. Set Up Cron Jobs

Go to [cron-job.org](https://cron-job.org) and create 2 free cron jobs:

**Morning Job:**

- URL: `https://your-site.netlify.app/.netlify/functions/send-notifications`
- Method: `POST`
- Body: `{"action":"send-notifications"}`
- Headers: `Content-Type: application/json`
- Schedule: `0 9 * * *` (9 AM daily)

**Evening Job:**

- URL: `https://your-site.netlify.app/.netlify/functions/send-notifications`
- Method: `POST`
- Body: `{"action":"send-notifications"}`
- Headers: `Content-Type: application/json`
- Schedule: `0 21 * * *` (9 PM daily)

### 3. Test

1. Open your app and enable notifications in Settings
2. Wait for the next scheduled time or test manually

## How It Works

1. User enables notifications → Frontend registers with backend
2. Cron job triggers twice daily → Backend sends notifications
3. Service worker receives notifications → Shows them to user

## Manual Test

```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/send-notifications \
  -H "Content-Type: application/json" \
  -d '{"action":"send-notifications"}'
```
