# Telegram

Bot: `@Tangoslavique_bot`  
Webhook: `https://tango-slavique-api.4507208.workers.dev/api/telegram/webhook`  
Mini App: `https://tango.bavariagloss.de/miniapp`

## Secrets (Cloudflare Worker only, never in git)

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `TELEGRAM_ADMIN_IDS` (comma-separated numeric user IDs)
- `TELEGRAM_ADMIN_CHAT_ID` (admin group chat ID)

Webhook requests must send `X-Telegram-Bot-Api-Secret-Token` matching `TELEGRAM_WEBHOOK_SECRET`. Invalid or missing secret → HTTP 401.

The Worker does not echo ordinary group messages. Private `/start` replies with an inline button that opens the Mini App. Other private messages get a short status reply.

Admin callbacks on application notifications: Open / Approve / Reject / Request information. Only IDs in `TELEGRAM_ADMIN_IDS` can execute those actions. Callback data is not trusted without a server-side admin check. Approving an application with a linked user marks the profile public and runs matching.

## Mini App auth

`POST /api/auth/telegram` with Telegram WebApp `initData`. The Worker validates HMAC using the bot token. `initDataUnsafe` is never trusted. Session tokens are hashed with SHA-256 before storage.

## Automatic Worker setup

A successful `GET /api/health` also triggers (in the background, without changing the health JSON):

- `setWebhook` if the current webhook URL is not the Worker webhook
- `setChatMenuButton` to the Mini App URL (throttled)
- `setMyCommands` for `/start`

This uses Cloudflare secrets in place. It never prints token or secret values.

## Telegram setup

1. Secrets are already stored in the Cloudflare Worker. Do not paste them into git or Vercel `NEXT_PUBLIC_*` variables.
2. After deploy, hit `GET /api/health` so the Worker can register the webhook.
3. Confirm unauthorized webhook calls return 401:
   `curl.exe -sS -D - -X POST https://tango-slavique-api.4507208.workers.dev/api/telegram/webhook`
4. Open `@Tangoslavique_bot` and send `/start`. The Mini App button should appear.

## Mini App setup (BotFather)

If the menu button is missing or Telegram refuses to open the Web App, one manual BotFather step is required:

1. Open BotFather
2. `/mybots` → `@Tangoslavique_bot` → Bot Settings → Domain
3. Set domain to `tango.bavariagloss.de`
4. Mini App URL: `https://tango.bavariagloss.de/miniapp`

Creating the Mini App entry in BotFather (`/newapp`) is also a manual BotFather action if it is not already created.
