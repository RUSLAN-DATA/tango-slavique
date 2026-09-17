# Architecture

Tango Slavique keeps the existing Next.js marketing site on Vercel (`https://tango.bavariagloss.de`) and uses a Cloudflare Worker as the matchmaking backend.

- Frontend: Next.js 14 on Vercel. Landing, Gemini concierge (`/api/chat`), legal pages and public UI stay there.
- Backend: Cloudflare Worker `tango-slavique-api` at `https://tango-slavique-api.4507208.workers.dev`.
- Database: Cloudflare D1 `tango-slavique` (binding `DB`).
- Photos: Cloudflare R2 `tango-slavique-photos` (binding `PHOTOS`).
- Telegram: Bot `@Tangoslavique_bot`, webhook `POST /api/telegram/webhook`.
- Mini App: `/miniapp` on the Vercel site, authenticated against the Worker with Telegram `initData`.

Website applications post to Next.js `/api/application`, which proxies to the Worker. The Worker stores the row in D1 first, then notifies the Telegram admin group. If Telegram is down, the application remains saved.

Do not put secrets in this repository, `wrangler.toml`, or `NEXT_PUBLIC_*` variables.
