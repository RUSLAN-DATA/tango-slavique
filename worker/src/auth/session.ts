import type { Env } from "../env";
import { newId, nowIso, sha256Hex } from "../crypto";
import { isTelegramAdmin, parseTelegramAdminIds } from "../telegram/adminIds";

export type AppUser = {
  id: string;
  telegram_user_id: string | null;
  email: string | null;
  phone: string | null;
  role: "user" | "admin";
  status: string;
};

export async function createSession(env: Env, userId: string): Promise<string> {
  const token = crypto.randomUUID() + crypto.randomUUID();
  const tokenHash = await sha256Hex(token);
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare(
    "INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(newId(), userId, tokenHash, expires, nowIso())
    .run();
  return token;
}

export async function userFromSessionToken(
  env: Env,
  token: string | null
): Promise<AppUser | null> {
  if (!token) {
    return null;
  }
  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    `SELECT u.id, u.telegram_user_id, u.email, u.phone, u.role, u.status, s.expires_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ?`
  )
    .bind(tokenHash)
    .first<AppUser & { expires_at: string }>();

  if (!row || new Date(row.expires_at).getTime() < Date.now()) {
    return null;
  }
  return {
    id: row.id,
    telegram_user_id: row.telegram_user_id,
    email: row.email,
    phone: row.phone,
    role: row.role === "admin" ? "admin" : "user",
    status: row.status,
  };
}

export function bearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export async function requireUser(env: Env, request: Request): Promise<AppUser> {
  const user = await userFromSessionToken(env, bearerToken(request));
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export function isAdminUser(env: Env, user: AppUser): boolean {
  return isTelegramAdmin(
    parseTelegramAdminIds(env.TELEGRAM_ADMIN_IDS),
    user.telegram_user_id
  );
}

export async function requireAdmin(env: Env, request: Request): Promise<AppUser> {
  const user = await requireUser(env, request);
  if (!isAdminUser(env, user)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function upsertTelegramUser(
  env: Env,
  telegramUserId: string,
  firstName?: string,
  lastName?: string
): Promise<AppUser> {
  const existing = await env.DB.prepare(
    "SELECT id, telegram_user_id, email, phone, role, status FROM users WHERE telegram_user_id = ?"
  )
    .bind(telegramUserId)
    .first<AppUser>();

  const admin = isTelegramAdmin(
    parseTelegramAdminIds(env.TELEGRAM_ADMIN_IDS),
    telegramUserId
  );
  const role = admin ? "admin" : "user";
  const now = nowIso();

  if (existing) {
    await env.DB.prepare(
      "UPDATE users SET role = ?, updated_at = ? WHERE id = ?"
    )
      .bind(role, now, existing.id)
      .run();
    return { ...existing, role };
  }

  const userId = newId();
  await env.DB.prepare(
    "INSERT INTO users (id, telegram_user_id, email, phone, role, status, created_at, updated_at) VALUES (?, ?, NULL, NULL, ?, 'active', ?, ?)"
  )
    .bind(userId, telegramUserId, role, now, now)
    .run();

  const profileId = newId();
  await env.DB.prepare(
    "INSERT INTO profiles (id, user_id, first_name, last_name, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'draft', ?, ?)"
  )
    .bind(profileId, userId, firstName || null, lastName || null, now, now)
    .run();

  return {
    id: userId,
    telegram_user_id: telegramUserId,
    email: null,
    phone: null,
    role,
    status: "active",
  };
}
