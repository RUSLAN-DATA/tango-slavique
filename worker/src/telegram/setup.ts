import type { Env } from "../env";
import { telegramApi } from "./api";
import { enforceRateLimit } from "../rateLimit";
import { miniAppHttpsUrl } from "./miniAppLinks";
import { ensureAdminGroupCommands, ensureAdminGroupHub } from "./adminHub";
import { parseTelegramAdminIds } from "./adminIds";

const WEBHOOK_URL =
  "https://tango-slavique-api.4507208.workers.dev/api/telegram/webhook";

type WebhookInfo = {
  ok?: boolean;
  result?: {
    url?: string;
  };
};

export async function ensureTelegramRuntime(env: Env): Promise<void> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_WEBHOOK_SECRET) {
    return;
  }

  try {
    const info = (await telegramApi(env, "getWebhookInfo", {})) as WebhookInfo;
    const current = info.result?.url || "";
    if (current !== WEBHOOK_URL) {
      await telegramApi(env, "setWebhook", {
        url: WEBHOOK_URL,
        secret_token: env.TELEGRAM_WEBHOOK_SECRET,
        allowed_updates: ["message", "callback_query"],
      });
    }

    await ensureAdminGroupHub(env).catch(() => undefined);

    const throttle = await enforceRateLimit(
      env,
      "telegram:runtime-setup",
      1,
      60 * 60 * 1000
    ).catch(() => false);
    if (!throttle && current === WEBHOOK_URL) {
      return;
    }

    await telegramApi(env, "setChatMenuButton", {
      menu_button: {
        type: "web_app",
        text: "Open",
        web_app: { url: miniAppHttpsUrl(env) },
      },
    }).catch(() => undefined);

    await telegramApi(env, "setMyCommands", {
      commands: [{ command: "start", description: "Open Tango Slavique" }],
    }).catch(() => undefined);

    const adminCommands = [
      { command: "admin", description: "Admin Panel" },
      { command: "applications", description: "Applications" },
      { command: "profiles", description: "Profiles" },
      { command: "blog", description: "Blog" },
      { command: "content", description: "Website Content" },
      { command: "notifications", description: "Notifications" },
      { command: "settings", description: "Settings" },
      { command: "start", description: "Open menu" },
    ];
    for (const adminId of parseTelegramAdminIds(env.TELEGRAM_ADMIN_IDS)) {
      await telegramApi(env, "setMyCommands", {
        commands: adminCommands,
        scope: { type: "chat", chat_id: Number(adminId) },
      }).catch(() => undefined);
      await telegramApi(env, "setChatMenuButton", {
        chat_id: Number(adminId),
        menu_button: {
          type: "web_app",
          text: "Admin",
          web_app: { url: miniAppHttpsUrl(env, "admin") },
        },
      }).catch(() => undefined);
    }

    await ensureAdminGroupCommands(env).catch(() => undefined);
  } catch {
    console.error("Telegram runtime setup failed");
  }
}
