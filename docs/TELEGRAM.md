# Telegram

Bot: `@Tangoslavique_bot`  
Webhook: `https://tango-slavique-api.4507208.workers.dev/api/telegram/webhook`  
Mini App: `https://tango.bavariagloss.de/miniapp`

## Secrets (Cloudflare Worker only, never in git)

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `TELEGRAM_ADMIN_IDS` (comma-separated numeric user IDs)
- `TELEGRAM_ADMIN_CHAT_ID` (admin group chat ID)
- `GEMINI_API_KEY` (optional; AI photo review and blog translation)

Webhook requests must send `X-Telegram-Bot-Api-Secret-Token` matching `TELEGRAM_WEBHOOK_SECRET`. Invalid or missing secret → HTTP 401.

## Admin group control center

The admin Telegram group is the entry point to the Admin Mini App. Authorization is still the Telegram user ID in `TELEGRAM_ADMIN_IDS`. Group membership alone does not grant admin rights. Every ID in `TELEGRAM_ADMIN_IDS` has the same permissions.

The Worker pins (or sends) a persistent hub message:

```
📋 TANGO SLAVIQUE ADMIN
🛠 Admin Panel
[ Open Admin Panel ]
```

Telegram does not allow inline `web_app` buttons in groups, so the group button is a native Mini App Direct Link (`https://t.me/Tangoslavique_bot?startapp=admin`). In the private bot chat, `/start` and `/admin` use a real Web App button.

Group commands (admin group only): `/admin`, `/applications`, `/profiles`, `/blog`.

The Worker does not reply to ordinary group chatter. Non-admins who tap Admin Panel still open the Mini App, but the Worker will not enable admin mode and admin APIs return 403.

## Mini App modes

1. Normal user: open the Mini App from the private bot chat → user profile, photos, matches.
2. Admin: an authorized administrator opens it from the admin group or the Admin Panel button → full Admin Panel.

Admin APIs are authorized server-side from validated `initData` → Telegram user ID → `TELEGRAM_ADMIN_IDS`. Frontend role flags, URL parameters, usernames, and group membership are not trusted.

New applications notify the admin group with:

👁 Open · ✅ Approve · ❌ Reject · ℹ️ Need info

Open launches the relevant application in the Admin Mini App. Approve / Reject / Need info work for every authorized administrator.

## Mini App auth

`POST /api/auth/telegram` with Telegram WebApp `initData`. The Worker validates HMAC using the bot token. `initDataUnsafe` is never trusted. Session tokens are hashed with SHA-256 before storage.

## Automatic Worker setup

A successful `GET /api/health` also triggers (in the background, without changing the health JSON):

- `setWebhook` if the current webhook URL is not the Worker webhook
- `setChatMenuButton` to the Mini App URL (throttled)
- `setMyCommands` for `/start` and admin-group commands
- pin/send the Admin Panel hub message in the admin group if it is not already pinned

This uses Cloudflare secrets in place. It never prints token or secret values.

## Telegram setup

1. Secrets are already stored in the Cloudflare Worker. Do not paste them into git or Vercel `NEXT_PUBLIC_*` variables.
2. After deploy, hit `GET /api/health` so the Worker can register the webhook and the admin hub message.
3. Confirm unauthorized webhook calls return 401:
   `curl.exe -sS -D - -X POST https://tango-slavique-api.4507208.workers.dev/api/telegram/webhook`
4. Open `@Tangoslavique_bot` and send `/start`. The Mini App button should appear.
5. In the admin group, look for the pinned **🛠 Admin Panel** message, or send `/admin`.

The bot must be able to post in the admin group. To pin the hub message automatically, the bot also needs permission to pin messages. If pinning fails, pin the Admin Panel message manually.

## Mini App setup (BotFather)

If the menu button is missing or Telegram refuses to open the Web App, one manual BotFather step is required:

1. Open BotFather
2. `/mybots` → `@Tangoslavique_bot` → Bot Settings → Domain
3. Set domain to `tango.bavariagloss.de`
4. Mini App URL: `https://tango.bavariagloss.de/miniapp`

Creating the Mini App entry in BotFather (`/newapp`) is also a manual BotFather action if it is not already created. If you create a named Mini App, set Worker var `TELEGRAM_MINIAPP_SHORT_NAME` to that short name so group Direct Links use `https://t.me/Tangoslavique_bot/<shortName>?startapp=admin`.
