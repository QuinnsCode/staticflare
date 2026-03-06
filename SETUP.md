# FlareUp Setup

## What you need

### 1. Create KV namespace
```bash
wrangler kv namespace create "ALERT_CONFIG_KV"
# Copy the ID into wrangler.jsonc
```

### 2. Set secrets (never committed, encrypted at rest on CF)
```bash
# Required: encrypts the session cookie
wrangler secret put APP_SECRET
# → paste any long random string, e.g: openssl rand -base64 32

# Optional: enables background cron monitoring
# Without these, cron runs silently but does nothing
# Users can still use the dashboard via browser session
wrangler secret put CF_API_TOKEN
# → Account Analytics: Read token
# → Create at: https://dash.cloudflare.com/profile/api-tokens/create

wrangler secret put CF_ACCOUNT_ID
# → Your 32-char account ID from the dashboard URL
```

### 3. Deploy
```bash
pnpm run deploy
```

## That's it

Dashboard: https://flareup.dev/dashboard  
Alert config: https://flareup.dev/alerts  

## Token requirements

FlareUp **rejects** tokens with write/edit/admin permissions.  
Create a token with **only**: Account → Account Analytics → Read

Quick link:  
https://dash.cloudflare.com/profile/api-tokens/create?permissionGroupKeys=analytics_read&name=flareup-readonly

## Security model

- Browser session: token encrypted in HttpOnly cookie, never in JS, clears after 8hrs
- Background cron: token stored as CF Worker secret on your account, never in any DB
- FlareUp never stores your token in a database
- Read-only enforcement: token permissions verified on connect, write tokens rejected