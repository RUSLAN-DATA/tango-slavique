import { hmacSha256, hmacSha256Hex, timingSafeEqual } from "../crypto";

export type TelegramWebAppUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

export type TelegramInitData = {
  user: TelegramWebAppUser;
  authDate: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function validateTelegramInitData(
  botToken: string,
  initData: string,
  maxAgeSeconds = 86_400
): Promise<TelegramInitData> {
  if (!botToken || !initData.trim()) {
    throw new Error("INVALID_INIT_DATA");
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) {
    throw new Error("INVALID_INIT_DATA");
  }
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = await hmacSha256(
    new TextEncoder().encode("WebAppData"),
    botToken
  );
  const computed = await hmacSha256Hex(secretKey, dataCheckString);
  if (!timingSafeEqual(computed, hash)) {
    throw new Error("INVALID_INIT_DATA");
  }

  const authDate = Number(params.get("auth_date") || 0);
  if (!Number.isFinite(authDate) || authDate <= 0) {
    throw new Error("INVALID_INIT_DATA");
  }
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > maxAgeSeconds) {
    throw new Error("EXPIRED_INIT_DATA");
  }

  const rawUser = params.get("user");
  if (!rawUser) {
    throw new Error("INVALID_INIT_DATA");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawUser);
  } catch {
    throw new Error("INVALID_INIT_DATA");
  }

  if (!isRecord(parsed) || typeof parsed.id !== "number") {
    throw new Error("INVALID_INIT_DATA");
  }

  return {
    authDate,
    user: {
      id: parsed.id,
      first_name: typeof parsed.first_name === "string" ? parsed.first_name : undefined,
      last_name: typeof parsed.last_name === "string" ? parsed.last_name : undefined,
      username: typeof parsed.username === "string" ? parsed.username : undefined,
      language_code:
        typeof parsed.language_code === "string" ? parsed.language_code : undefined,
    },
  };
}
