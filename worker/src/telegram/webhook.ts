import type { Env } from "../env";
import { json } from "../http";
import { timingSafeEqual } from "../crypto";
import { isTelegramAdmin, parseTelegramAdminIds } from "./adminIds";
import { answerTelegramCallbackQuery } from "./api";
import { downloadTelegramFile } from "./api";
import { handleAdminCallback } from "./adminActions";
import { handleAdminMedia } from "./adminInbox";
import { sendTelegramMessage } from "./api";
import { sendAdminHub, sendPrivateAdminPanel, sendAdminMenu } from "./adminHub";
import { isAdminPanelCommand, miniAppHttpsUrl } from "./miniAppLinks";
import { handleCmsMessage } from "./cms";
import { telegramEntitiesToMarkdown } from "../../../lib/blog/format";
import { copyFor, localeFromTelegram, menuActionForText } from "./cmsCopy";

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

function getLanguageCode(container: Record<string, unknown> | null): string {
  if (!container || !isRecord(container.from)) {
    return "";
  }
  return typeof container.from.language_code === "string" ? container.from.language_code : "";
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
  const raw =
    typeof message.text === "string"
      ? message.text
      : typeof message.caption === "string"
        ? message.caption
        : "";
  const entities = Array.isArray(message.entities)
    ? message.entities
    : Array.isArray(message.caption_entities)
      ? message.caption_entities
      : [];
  return telegramEntitiesToMarkdown(
    raw,
    entities.filter(isRecord) as Array<{ type?: string; offset?: number; length?: number }>
  );
}

function isPrivateChat(chatType: string | null): boolean {
  return chatType === "private";
}

function miniAppUrl(env: Env, startParam?: string): string {
  return miniAppHttpsUrl(env, startParam);
}

function isAdminGroup(env: Env, chatId: number | string | null): boolean {
  const expected = env.TELEGRAM_ADMIN_CHAT_ID?.trim() ?? "";
  return chatId !== null && expected !== "" && String(chatId) === expected;
}

function largestPhotoId(message: Record<string, unknown>): string | null {
  if (!Array.isArray(message.photo) || message.photo.length === 0) {
    return null;
  }
  let best: { file_id: string; score: number } | null = null;
  for (const item of message.photo) {
    if (!isRecord(item) || typeof item.file_id !== "string") continue;
    const width = typeof item.width === "number" ? item.width : 0;
    const height = typeof item.height === "number" ? item.height : 0;
    const size = typeof item.file_size === "number" ? item.file_size : width * height;
    const score = size || width * height;
    if (!best || score >= best.score) {
      best = { file_id: item.file_id, score };
    }
  }
  return best?.file_id || null;
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

function documentImageMime(message: Record<string, unknown>): string | null {
  if (!isRecord(message.document)) {
    return null;
  }
  const mime = typeof message.document.mime_type === "string" ? message.document.mime_type : "";
  return mime.startsWith("image/") ? mime : null;
}

function mimeFromPath(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

async function handleStart(
  env: Env,
  chatId: number | string,
  admin: boolean,
  startParam?: string,
  adminId?: string | null,
  languageCode?: string
): Promise<void> {
  if (admin && adminId) {
    await sendAdminMenu(env, chatId, adminId);
    return;
  }
  const t = copyFor(localeFromTelegram(languageCode));
  await sendTelegramMessage(
    env,
    chatId,
    t.userWelcome,
    {
      reply_markup: {
        inline_keyboard: [[{ text: t.openMiniApp, web_app: { url: miniAppUrl(env, startParam || undefined) } }]],
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
    const inAdminGroup = isAdminGroup(env, chatId);
    const photoId = documentImageId(message) || largestPhotoId(message);

    if (chatId !== null && isPrivateChat(chatType)) {
      const start = text.match(/^\/start(?:@\w+)?(?:\s+(\S+))?$/i);
      if (start) {
        await handleStart(env, chatId, admin, start[1] || undefined, userId, getLanguageCode(message));
        return;
      }
      if (isAdminPanelCommand(text)) {
        if (admin && userId) {
          await sendAdminMenu(env, chatId, userId);
        }
        return;
      }
      if (admin) {
        const menu = menuActionForText(text);
        if (menu) {
          await handleAdminCallback(env, userId || "", "0", `m:${menu}`, chatId);
          return;
        }
        const file = photoId ? await downloadTelegramFile(env, photoId) : null;
        const media = file
          ? {
              bytes: file.bytes,
              mime: documentImageMime(message) || mimeFromPath(file.path),
            }
          : null;
        if (await handleCmsMessage(env, userId || "", chatId, text, media)) {
          return;
        }
        if (/^\/(applications|profiles|notifications|settings)(?:@\w+)?$/i.test(text)) {
          const map: Record<string, string> = {
            applications: "m:apps",
            profiles: "m:prof",
            notifications: "m:notifications",
            settings: "m:settings",
          };
          const key = text.replace(/^\//, "").replace(/@\w+$/, "").toLowerCase();
          await handleAdminCallback(env, userId || "", "0", map[key] || "m:apps", chatId);
          return;
        }
        if (photoId || text) {
          await handleAdminMedia(env, userId || "", chatId, text, media);
          return;
        }
      }
    }

    if (chatId !== null && inAdminGroup) {
      if (isAdminPanelCommand(text) || /^\/start(?:@\w+)?(?:\s|$)/i.test(text)) {
        if (admin && userId) {
          if (env.TELEGRAM_MINIAPP_SHORT_NAME?.trim()) {
            await sendAdminHub(env, chatId, "url");
          } else {
            await sendPrivateAdminPanel(env, userId);
          }
        }
        return;
      }
      if (admin) {
        const file = photoId ? await downloadTelegramFile(env, photoId) : null;
        const media = file
          ? {
              bytes: file.bytes,
              mime: documentImageMime(message) || mimeFromPath(file.path),
            }
          : null;
        if (await handleCmsMessage(env, userId || "", chatId, text, media)) {
          return;
        }
        if (/^\/(applications|profiles|notifications|settings)/i.test(text) && !photoId) {
          const key = text.replace(/^\//, "").split(/\s+/)[0].replace(/@\w+$/, "").toLowerCase();
          const map: Record<string, string> = {
            applications: "m:apps",
            profiles: "m:prof",
            notifications: "m:notifications",
            settings: "m:settings",
          };
          await handleAdminCallback(env, userId || "", "0", map[key] || "m:apps", chatId);
          return;
        }
        if (photoId || text) {
          await handleAdminMedia(env, userId || "", chatId, text, media);
        }
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
