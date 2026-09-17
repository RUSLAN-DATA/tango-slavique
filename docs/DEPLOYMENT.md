# Deployment

## Development

Frontend:

```powershell
npm install
copy .env.example .env.local
npm run dev
```

Worker:

```powershell
cd worker
npm install
copy .dev.vars.example .dev.vars
npx wrangler d1 migrations apply tango-slavique --local
npx wrangler dev
```

Fill `.env.local` and `.dev.vars` locally. Never commit them.

Useful checks:

```powershell
npm run lint
npm test
npx tsc --noEmit
cd worker
npm test
npx tsc --noEmit
```

## Production

- Site: `https://tango.bavariagloss.de`
- Mini App: `https://tango.bavariagloss.de/miniapp`
- Worker: `https://tango-slavique-api.4507208.workers.dev`
- Health: `GET /api/health` → `{"ok":true,"service":"tango-slavique-api"}`

Vercel builds the Next.js app from GitHub `main`. Cloudflare Worker is deployed with Wrangler.

## Deployment

Worker:

```powershell
cd worker
npm install
npx wrangler d1 migrations apply tango-slavique --remote
npx wrangler deploy
```

Frontend: push to `origin/main`. Vercel deploys automatically if the GitHub project is connected.

Verify:

```powershell
curl.exe https://tango-slavique-api.4507208.workers.dev/api/health
curl.exe -sS -D - -X POST https://tango-slavique-api.4507208.workers.dev/api/telegram/webhook
```

Unauthorized webhook check must return HTTP 401.

## Environment variables

### Cloudflare Worker secrets

Set in the Cloudflare dashboard / `wrangler secret`. Never put them in `wrangler.toml`.

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ADMIN_IDS`
- `TELEGRAM_ADMIN_CHAT_ID`
- `TELEGRAM_WEBHOOK_SECRET`

Worker vars in `wrangler.toml`:

- `MINIAPP_URL=https://tango.bavariagloss.de/miniapp`
- `APP_ORIGIN=https://tango.bavariagloss.de`
- `TELEGRAM_BOT_USERNAME=Tangoslavique_bot`

### Vercel / Next.js

Required for existing site features (already used by the live site):

- `GEMINI_API_KEY` for `/api/chat`
- `AUTH_SECRET` for the website account session
- `DATABASE_URL` for the existing Prisma account/admin UI
- optional `WORKER_URL` / `NEXT_PUBLIC_WORKER_URL` (defaults to the Worker URL above)

Do not put Telegram tokens in Vercel `NEXT_PUBLIC_*` variables.

## Telegram setup

See `docs/TELEGRAM.md`. After Worker deploy, call `/api/health` so webhook registration can run.

## Mini App setup

Mini App URL: `https://tango.bavariagloss.de/miniapp`. Domain `tango.bavariagloss.de` must be allowed in BotFather if Telegram blocks the Web App.
