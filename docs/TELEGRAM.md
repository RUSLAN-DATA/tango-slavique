# Telegram

Bot: `@Tangoslavique_bot`  
Webhook: `https://tango-slavique-api.4507208.workers.dev/api/telegram/webhook`

Secrets (Cloudflare Worker only, never in git):

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `TELEGRAM_ADMIN_IDS` (comma-separated numeric user IDs)
- `TELEGRAM_ADMIN_CHAT_ID` (admin group chat ID)

Webhook requests must send `X-Telegram-Bot-Api-Secret-Token` matching `TELEGRAM_WEBHOOK_SECRET`. Invalid secret → HTTP 401.

Private `/start` opens the Mini App (`https://tango.bavariagloss.de/miniapp`).  
Admin callbacks on application notifications: Open / Approve / Reject / Request information.  
Only IDs in `TELEGRAM_ADMIN_IDS` can execute admin actions. Callback data is not trusted without a server-side admin check.

Mini App auth: `POST /api/auth/telegram` with Telegram WebApp `initData`. The Worker validates HMAC using the bot token. `initDataUnsafe` is never trusted.

Point the bot menu / Mini App URL at `https://tango.bavariagloss.de/miniapp` in BotFather if it is not already set.
