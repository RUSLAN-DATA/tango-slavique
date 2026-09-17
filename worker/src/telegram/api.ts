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
