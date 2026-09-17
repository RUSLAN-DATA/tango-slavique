import type { Env } from "../env";
import { telegramApi, telegramApiCatch, sendTelegramMessage } from "./api";
import { ADMIN_HUB_TEXT, adminPanelButton } from "./miniAppLinks";
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
    };
  };
};

type SendResult = {
  ok?: boolean;
  result?: { message_id?: number };
};

function pinnedLooksLikeHub(text: string | undefined): boolean {
  if (!text) {
    return false;
  }
  return text.includes("TANGO SLAVIQUE ADMIN") && text.includes("Admin Panel");
}

export async function ensureAdminGroupHub(env: Env): Promise<void> {
  const chatId = adminChatId(env);
  if (!chatId || !env.TELEGRAM_BOT_TOKEN) {
    return;
  }

  const chat = (await telegramApiCatch(env, "getChat", {
    chat_id: chatId,
  })) as ChatInfo | null;
  if (pinnedLooksLikeHub(chat?.result?.pinned_message?.text)) {
    return;
  }

  const allowed = await enforceRateLimit(
    env,
    "telegram:admin-hub",
    1,
    7 * 24 * 60 * 60 * 1000
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
