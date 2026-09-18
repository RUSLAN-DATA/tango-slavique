import type { Env } from "../env";
import { telegramApi, telegramApiCatch, sendTelegramMessage } from "./api";
import {
  ADMIN_HUB_TEXT,
  adminPanelButton,
  isBrokenGroupMiniAppUrl,
  miniAppHttpsUrl,
} from "./miniAppLinks";
import { enforceRateLimit } from "../rateLimit";

function adminChatId(env: Env): string | null {
  const value = env.TELEGRAM_ADMIN_CHAT_ID?.trim() ?? "";
  return /^-?\d+$/.test(value) ? value : null;
}

export async function sendAdminHub(
  env: Env,
  chatId: number | string,
  kind: "web_app" | "url"
): Promise<unknown> {
  return sendTelegramMessage(env, chatId, ADMIN_HUB_TEXT, {
    reply_markup: {
      inline_keyboard: [[{ ...adminPanelButton(env, kind) }]],
    },
  });
}

type ChatInfo = {
  ok?: boolean;
  result?: {
    pinned_message?: {
      message_id?: number;
      text?: string;
      reply_markup?: {
        inline_keyboard?: Array<Array<{ url?: string; web_app?: { url?: string } }>>;
      };
    };
  };
};

type SendResult = {
  ok?: boolean;
  result?: { message_id?: number };
};

type PinnedMessage = NonNullable<NonNullable<ChatInfo["result"]>["pinned_message"]>;

function pinnedLooksLikeHub(text: string | undefined): boolean {
  if (!text) {
    return false;
  }
  return text.includes("TANGO SLAVIQUE ADMIN") && text.includes("Admin Panel");
}

function pinnedHubLaunchIsBroken(env: Env, pinned: PinnedMessage | undefined): boolean {
  const buttons = pinned?.reply_markup?.inline_keyboard?.flat() || [];
  if (!buttons.length) {
    return true;
  }
  return buttons.some(
    (button) =>
      Boolean(button.web_app) ||
      (typeof button.url === "string" && isBrokenGroupMiniAppUrl(button.url, env))
  );
}

export async function sendPrivateAdminPanel(
  env: Env,
  telegramUserId: string,
  startParam = "admin"
): Promise<boolean> {
  try {
    await sendTelegramMessage(env, telegramUserId, "Open the Admin Panel.", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🛠 Admin Panel",
              web_app: { url: miniAppHttpsUrl(env, startParam) },
            },
          ],
        ],
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function ensureAdminGroupHub(env: Env): Promise<void> {
  const chatId = adminChatId(env);
  if (!chatId || !env.TELEGRAM_BOT_TOKEN) {
    return;
  }

  const chat = (await telegramApiCatch(env, "getChat", {
    chat_id: chatId,
  })) as ChatInfo | null;
  const pinned = chat?.result?.pinned_message;
  const looksLikeHub = pinnedLooksLikeHub(pinned?.text);
  const broken = pinnedHubLaunchIsBroken(env, pinned);
  if (looksLikeHub && !broken) {
    return;
  }

  const allowed = await enforceRateLimit(
    env,
    looksLikeHub ? "telegram:admin-hub-repair-startlink" : "telegram:admin-hub",
    1,
    looksLikeHub ? 15 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
  ).catch(() => false);
  if (!allowed) {
    return;
  }

  const sent = (await sendAdminHub(env, chatId, "url")) as SendResult;
  const messageId = sent?.result?.message_id;
  if (!messageId) {
    return;
  }

  await telegramApiCatch(env, "pinChatMessage", {
    chat_id: chatId,
    message_id: messageId,
    disable_notification: true,
  });
}

export async function ensureAdminGroupCommands(env: Env): Promise<void> {
  const chatId = adminChatId(env);
  if (!chatId) {
    return;
  }
  await telegramApi(env, "setMyCommands", {
    commands: [
      { command: "admin", description: "Open Admin Panel" },
      { command: "applications", description: "Review applications" },
      { command: "profiles", description: "Review profiles" },
      { command: "blog", description: "Blog drafts" },
    ],
    scope: { type: "chat", chat_id: chatId },
  }).catch(() => undefined);
}
