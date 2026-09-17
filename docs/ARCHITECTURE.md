# Architecture

Tango Slavique keeps the existing Next.js marketing site on Vercel (`https://tango.bavariagloss.de`) and uses a Cloudflare Worker as the matchmaking backend.

## Frontend

- Next.js 14 on Vercel
- Landing, Gemini concierge (`/api/chat`), legal pages, public UI, and Telegram Mini App (`/miniapp`) stay on the site
- Website applications post to Next.js `/api/application`, which proxies to the Worker
- Mini App talks to the Worker directly with a Bearer session token

## Backend

- Cloudflare Worker `tango-slavique-api`
- URL: `https://tango-slavique-api.4507208.workers.dev`
- Database: Cloudflare D1 `tango-slavique` (binding `DB`)
- Photos: Cloudflare R2 `tango-slavique-photos` (binding `PHOTOS`)
- Telegram bot: `@Tangoslavique_bot`
- Webhook: `POST /api/telegram/webhook`

Website applications are stored in D1 first, then the Worker notifies the Telegram admin group. If Telegram is down, the application remains saved.

Do not put secrets in this repository, `wrangler.toml`, or `NEXT_PUBLIC_*` variables.

## Auth model

Mini App auth is Telegram `initData` validated on the Worker with HMAC (`POST /api/auth/telegram`). The Worker creates a session and stores only a SHA-256 hash of the token. Admin rights are checked server-side against `TELEGRAM_ADMIN_IDS`, never from a client-supplied role. Every ID in `TELEGRAM_ADMIN_IDS` has the same admin permissions. The admin Telegram group is the convenient entry point to the Admin Mini App; group membership alone does not grant access.

## Photo storage

R2 is private. Objects use `users/{userId}/{uuid}.ext`. The Worker streams files only to the owner, an admin, or after admin approval. The bucket itself is not public.
