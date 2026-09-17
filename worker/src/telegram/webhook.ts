import type { Env } from "../env";
import { json } from "../http";
import { timingSafeEqual } from "../crypto";
import { isTelegramAdmin, parseTelegramAdminIds } from "./adminIds";
import { answerTelegramCallbackQuery } from "./api";
import { downloadTelegramFile } from "./api";
import { handleAdminCallback, sendAdminHome } from "./adminActions";
import { handleAdminMedia } from "./adminInbox";
import { sendTelegramMessage } from "./api";

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
  if (typeof message.text === "string") {
    return message.text;
  }
  if (typeof message.caption === "string") {
    return message.caption;
  }
  return "";
}

function isPrivateChat(chatType: string | null): boolean {
  return chatType === "private";
}

function miniAppUrl(env: Env): string {
  return env.MINIAPP_URL || "https://tango.bavariagloss.de/miniapp";
}

function isAdminGroup(env: Env, chatId: number | string | null): boolean {
  const expected = env.TELEGRAM_ADMIN_CHAT_ID?.trim() ?? "";
  return chatId !== null && expected !== "" && String(chatId) === expected;
}

function largestPhotoId(message: Record<string, unknown>): string | null {
  if (!Array.isArray(message.photo) || message.photo.length === 0) {
    return null;
  }
  const last = message.photo[message.photo.length - 1];
  if (isRecord(last) && typeof last.file_id === "string") {
    return last.file_id;
  }
  return null;
}

function documentImageId(message: Record<string, unknown>): string | null {
  if (!isRecord(message.document)) {
    return null;
  }
  const mime = typeof message.document.mime_type === "string" ? message.document.mime_type : "";
  if (!mime.startsWith("image/") || typeof message.document.file_id !== "string") {
    return null;
  }
  return message.document.file_id;
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
      ? "Welcome. Open Mini App for profiles, or use the buttons below."
      : "Welcome to Tango Slavique. Open Mini App to create your profile.",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Open Mini App", web_app: { url: miniAppUrl(env) } }],
        ],
      },
    }
  );
  if (admin) {
    await sendAdminHome(env, chatId);
  }
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
    const inAdminGroup = isAdminGroup(env, chatId);
    const photoId = largestPhotoId(message) || documentImageId(message);

    if (chatId !== null && isPrivateChat(chatType)) {
      if (/^\/start(?:@\w+)?(?:\s|$)/i.test(text)) {
        await handleStart(env, chatId, admin);
        return;
      }
      if (admin) {
        if (/^\/(applications|profiles|blog)(?:@\w+)?$/i.test(text)) {
          const map: Record<string, string> = {
            applications: "m:apps",
            profiles: "m:prof",
            blog: "m:blog",
          };
          const key = text.replace(/^\//, "").replace(/@\w+$/, "").toLowerCase();
          await handleAdminCallback(env, userId || "", "0", map[key] || "m:apps", chatId);
          return;
        }
        if (photoId || text) {
          const file = photoId ? await downloadTelegramFile(env, photoId) : null;
          await handleAdminMedia(
            env,
            userId || "",
            chatId,
            text,
            file ? { bytes: file.bytes, mime: "image/jpeg" } : null
          );
          return;
        }
      }
    }

    if (chatId !== null && inAdminGroup && admin && (photoId || /^\/(blog|applications|profiles)/i.test(text))) {
      if (/^\/(applications|profiles|blog)/i.test(text) && !photoId) {
        const key = text.replace(/^\//, "").split(/\s+/)[0].toLowerCase();
        const map: Record<string, string> = {
          applications: "m:apps",
          profiles: "m:prof",
          blog: "m:blog",
        };
        await handleAdminCallback(env, userId || "", "0", map[key] || "m:blog", chatId);
        return;
      }
      const file = photoId ? await downloadTelegramFile(env, photoId) : null;
      await handleAdminMedia(
        env,
        userId || "",
        chatId,
        text,
        file ? { bytes: file.bytes, mime: "image/jpeg" } : null
      );
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
