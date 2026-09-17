import type { Env } from "../env";

export async function telegramApi(
  env: Env,
  method: string,
  payload: Record<string, unknown>
): Promise<unknown> {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("Telegram bot is not configured");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(`Telegram API ${method} failed (${response.status})`);
  }

  return response.json();
}

export async function telegramApiCatch(
  env: Env,
  method: string,
  payload: Record<string, unknown>
): Promise<unknown | null> {
  try {
    return await telegramApi(env, method, payload);
  } catch {
    return null;
  }
}

export function sendTelegramMessage(
  env: Env,
  chatId: number | string,
  text: string,
  extra: Record<string, unknown> = {}
): Promise<unknown> {
  return telegramApi(env, "sendMessage", {
    chat_id: chatId,
    text,
    ...extra,
  });
}

export function answerTelegramCallbackQuery(
  env: Env,
  callbackQueryId: string,
  text?: string
): Promise<unknown> {
  if (!callbackQueryId || callbackQueryId === "0") {
    return Promise.resolve({ ok: true });
  }
  return telegramApi(env, "answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    ...(text ? { text } : {}),
  });
}

export function sendTelegramPhoto(
  env: Env,
  chatId: number | string,
  photo: string,
  caption?: string
): Promise<unknown> {
  return telegramApi(env, "sendPhoto", {
    chat_id: chatId,
    photo,
    ...(caption ? { caption } : {}),
  });
}

export function sendTelegramDocument(
  env: Env,
  chatId: number | string,
  document: string,
  caption?: string
): Promise<unknown> {
  return telegramApi(env, "sendDocument", {
    chat_id: chatId,
    document,
    ...(caption ? { caption } : {}),
  });
}

export async function sendTelegramPhotoFile(
  env: Env,
  chatId: number | string,
  bytes: ArrayBuffer,
  filename: string,
  mimeType: string,
  caption?: string,
  extra: Record<string, unknown> = {}
): Promise<unknown> {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("Telegram bot is not configured");
  }
  const form = new FormData();
  form.set("chat_id", String(chatId));
  form.set(
    "photo",
    new File([bytes], filename, { type: mimeType || "image/jpeg" })
  );
  if (caption) {
    form.set("caption", caption.slice(0, 1000));
  }
  if (extra.reply_markup) {
    form.set("reply_markup", JSON.stringify(extra.reply_markup));
  }
  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendPhoto`,
    { method: "POST", body: form }
  );
  if (!response.ok) {
    throw new Error(`Telegram API sendPhoto failed (${response.status})`);
  }
  return response.json();
}

type TelegramFile = {
  ok?: boolean;
  result?: { file_path?: string };
};

export async function downloadTelegramFile(
  env: Env,
  fileId: string
): Promise<{ bytes: ArrayBuffer; path: string } | null> {
  const payload = (await telegramApi(env, "getFile", {
    file_id: fileId,
  })) as TelegramFile;
  const filePath = payload.result?.file_path;
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!filePath || !token) {
    return null;
  }
  const response = await fetch(
    `https://api.telegram.org/file/bot${token}/${filePath}`
  );
  if (!response.ok) {
    return null;
  }
  return { bytes: await response.arrayBuffer(), path: filePath };
}
