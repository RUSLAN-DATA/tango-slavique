import type { Env } from "../env";
import { json } from "../http";
import { timingSafeEqual } from "../crypto";
import { isTelegramAdmin, parseTelegramAdminIds } from "./adminIds";
import {
  answerTelegramCallbackQuery,
  sendTelegramMessage,
} from "./api";
import { handleAdminCallback } from "./adminActions";

const ADMIN_REPLY = "Tango Slavique Bot работает. Вы администратор.";
const USER_REPLY = "Tango Slavique Bot работает.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asNumericId(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }
  if (typeof value === "string" && /^\d+$/.test(value)) {
    return value;
  }
  return null;
}

function asChatId(value: unknown): number | string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && /^-?\d+$/.test(value)) {
    return value;
  }
  return null;
}

function getFromId(container: Record<string, unknown> | null): string | null {
  if (!container || !isRecord(container.from)) {
    return null;
  }
  return asNumericId(container.from.id);
}

function getChatId(container: Record<string, unknown> | null): number | string | null {
  if (!container || !isRecord(container.chat)) {
    return null;
  }
  return asChatId(container.chat.id);
}

function getChatType(container: Record<string, unknown> | null): string | null {
  if (!container || !isRecord(container.chat)) {
    return null;
  }
  return typeof container.chat.type === "string" ? container.chat.type : null;
}

function getMessageText(message: Record<string, unknown>): string {
  return typeof message.text === "string" ? message.text : "";
}

function isPrivateChat(chatType: string | null): boolean {
  return chatType === "private";
}

function miniAppUrl(env: Env): string {
  return env.MINIAPP_URL || "https://tango.bavariagloss.de/miniapp";
}

async function handleStart(
  env: Env,
  chatId: number | string,
  admin: boolean
): Promise<void> {
  await sendTelegramMessage(
    env,
    chatId,
    admin
      ? "Добро пожаловать в Tango Slavique. Откройте Mini App для работы с заявками."
      : "Добро пожаловать в Tango Slavique. Откройте Mini App, чтобы заполнить профиль.",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Открыть Mini App", web_app: { url: miniAppUrl(env) } }],
        ],
      },
    }
  );
}

async function processUpdate(env: Env, update: unknown): Promise<void> {
  if (!isRecord(update)) {
    return;
  }

  const adminIds = parseTelegramAdminIds(env.TELEGRAM_ADMIN_IDS);
  const message = isRecord(update.message) ? update.message : null;
  const callbackQuery = isRecord(update.callback_query)
    ? update.callback_query
    : null;

  if (message) {
    const userId = getFromId(message);
    const chatId = getChatId(message);
    const admin = isTelegramAdmin(adminIds, userId);
    const text = getMessageText(message).trim();
    const chatType = getChatType(message);

    if (chatId !== null && isPrivateChat(chatType)) {
      if (/^\/start(?:@\w+)?(?:\s|$)/i.test(text)) {
        await handleStart(env, chatId, admin);
      } else {
        await sendTelegramMessage(env, chatId, admin ? ADMIN_REPLY : USER_REPLY);
      }
    }
  }

  if (callbackQuery) {
    const callbackId =
      typeof callbackQuery.id === "string" ? callbackQuery.id : null;
    const userId = getFromId(callbackQuery);
    const callbackMessage = isRecord(callbackQuery.message)
      ? callbackQuery.message
      : null;
    const chatId = getChatId(callbackMessage) ?? userId;
    const data =
      typeof callbackQuery.data === "string" ? callbackQuery.data : "";

    if (callbackId && userId && data) {
      await handleAdminCallback(env, userId, callbackId, data, chatId);
      return;
    }
    if (callbackId) {
      await answerTelegramCallbackQuery(env, callbackId);
    }
  }
}

export async function handleTelegramWebhook(
  request: Request,
  env: Env
): Promise<Response> {
  const provided =
    request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
  const expected = env.TELEGRAM_WEBHOOK_SECRET ?? "";

  if (!timingSafeEqual(provided, expected)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let update: unknown;
  try {
    update = await request.json();
  } catch {
    return json({ ok: false, error: { code: "INVALID_JSON", message: "Invalid JSON" } }, 400);
  }

  try {
    await processUpdate(env, update);
  } catch {
    console.error("Telegram webhook processing failed");
    return json({ ok: false, error: { code: "WEBHOOK_ERROR", message: "Processing failed" } }, 500);
  }

  return json({ ok: true, data: {} });
}
