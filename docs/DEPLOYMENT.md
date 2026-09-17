# Deployment

## Worker

```powershell
cd worker
npm install
npx wrangler d1 migrations apply tango-slavique --remote
npx wrangler deploy
```

Verify:

```powershell
curl.exe https://tango-slavique-api.4507208.workers.dev/api/health
```

Expected: `{"ok":true,"service":"tango-slavique-api"}`

Unauthorized webhook check:

```powershell
curl.exe -sS -D - -X POST https://tango-slavique-api.4507208.workers.dev/api/telegram/webhook
```

Expected HTTP 401.

Secrets stay in the Cloudflare dashboard. Never pass them on the command line in shared logs.

## Frontend

The Next.js app remains on Vercel. Set optional `WORKER_URL` / `NEXT_PUBLIC_WORKER_URL` if the Worker URL changes. Defaults already point at `https://tango-slavique-api.4507208.workers.dev`.

Do not put Telegram tokens in Vercel `NEXT_PUBLIC_*` variables.
