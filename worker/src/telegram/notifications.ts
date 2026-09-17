import type { Env } from "../env";
import {
  sendTelegramDocument,
  sendTelegramMessage,
  sendTelegramPhoto,
  sendTelegramPhotoFile,
} from "./api";

function adminChatId(env: Env): string | null {
  const value = env.TELEGRAM_ADMIN_CHAT_ID?.trim() ?? "";
  return /^-?\d+$/.test(value) ? value : null;
}

export async function sendAdminMessage(
  env: Env,
  text: string,
  extra: Record<string, unknown> = {}
): Promise<boolean> {
  const chatId = adminChatId(env);
  if (!chatId) {
    return false;
  }
  await sendTelegramMessage(env, chatId, text, extra);
  return true;
}

export async function sendAdminPhoto(
  env: Env,
  photo: string,
  caption?: string
): Promise<boolean> {
  const chatId = adminChatId(env);
  if (!chatId) {
    return false;
  }
  await sendTelegramPhoto(env, chatId, photo, caption);
  return true;
}

export async function sendAdminDocument(
  env: Env,
  document: string,
  caption?: string
): Promise<boolean> {
  const chatId = adminChatId(env);
  if (!chatId) {
    return false;
  }
  await sendTelegramDocument(env, chatId, document, caption);
  return true;
}

export async function sendAdminPhotoFile(
  env: Env,
  bytes: ArrayBuffer,
  filename: string,
  mimeType: string,
  caption?: string,
  extra: Record<string, unknown> = {}
): Promise<boolean> {
  const chatId = adminChatId(env);
  if (!chatId) {
    return false;
  }
  await sendTelegramPhotoFile(env, chatId, bytes, filename, mimeType, caption, extra);
  return true;
}

export { sendTelegramMessage, sendTelegramPhotoFile };
