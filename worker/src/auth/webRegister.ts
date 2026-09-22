import type { Env } from "../env";
import { newId, nowIso } from "../crypto";
import type { AppUser } from "./session";

export type WebRegisterInput = {
  email: string;
  firstName: string;
  lastName: string;
  track?: "MAN" | "WOMAN" | "";
  phone?: string;
};

function genderFromTrack(track?: string) {
  if (track === "MAN") return "man";
  if (track === "WOMAN") return "woman";
  return "";
}

async function ensureProfile(
  env: Env,
  userId: string,
  input: WebRegisterInput,
  existingGender: string | null
) {
  const now = nowIso();
  const gender = existingGender || genderFromTrack(input.track);
  const profile = await env.DB.prepare("SELECT * FROM profiles WHERE user_id = ?")
    .bind(userId)
    .first<Record<string, unknown>>();
  if (profile) {
    const nextGender =
      typeof profile.gender === "string" && profile.gender.trim()
        ? profile.gender
        : gender || null;
    const nextFirst =
      typeof profile.first_name === "string" && profile.first_name.trim()
        ? profile.first_name
        : input.firstName;
    const nextLast =
      typeof profile.last_name === "string" && profile.last_name.trim()
        ? profile.last_name
        : input.lastName;
    await env.DB.prepare(
      `UPDATE profiles
       SET first_name = ?, last_name = ?, gender = ?, updated_at = ?
       WHERE user_id = ?`
    )
      .bind(nextFirst, nextLast, nextGender, now, userId)
      .run();
    return;
  }
  await env.DB.prepare(
    `INSERT INTO profiles
      (id, user_id, first_name, last_name, gender, status, current_step, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'draft', 1, ?, ?)`
  )
    .bind(newId(), userId, input.firstName, input.lastName, gender || null, now, now)
    .run();
}

async function ensurePreferences(env: Env, userId: string) {
  const existing = await env.DB.prepare(
    "SELECT id FROM partner_preferences WHERE user_id = ?"
  )
    .bind(userId)
    .first();
  if (existing) {
    return;
  }
  const now = nowIso();
  await env.DB.prepare(
    `INSERT INTO partner_preferences
      (id, user_id, gender, age_min, age_max, city, country, marital_status, children, languages, intent, notes, created_at, updated_at)
     VALUES (?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ?, ?)`
  )
    .bind(newId(), userId, now, now)
    .run();
}

export async function upsertWebUser(
  env: Env,
  input: WebRegisterInput
): Promise<AppUser> {
  const email = input.email.trim().toLowerCase();
  const existing = await env.DB.prepare(
    `SELECT id, telegram_user_id, email, phone, role, status, admin_locale
     FROM users
     WHERE email = ? AND telegram_user_id IS NULL
     LIMIT 1`
  )
    .bind(email)
    .first<AppUser>();

  const now = nowIso();
  const phone = input.phone?.trim() || null;

  if (existing) {
    if (phone) {
      await env.DB.prepare("UPDATE users SET phone = ?, updated_at = ? WHERE id = ?")
        .bind(phone, now, existing.id)
        .run();
    } else {
      await env.DB.prepare("UPDATE users SET updated_at = ? WHERE id = ?")
        .bind(now, existing.id)
        .run();
    }
    const profile = await env.DB.prepare(
      "SELECT gender FROM profiles WHERE user_id = ?"
    )
      .bind(existing.id)
      .first<{ gender: string | null }>();
    await ensureProfile(env, existing.id, input, profile?.gender || null);
    await ensurePreferences(env, existing.id);
    return {
      ...existing,
      phone: phone || existing.phone,
      role: "user",
    };
  }

  const userId = newId();
  await env.DB.prepare(
    `INSERT INTO users
      (id, telegram_user_id, email, phone, role, status, created_at, updated_at)
     VALUES (?, NULL, ?, ?, 'user', 'active', ?, ?)`
  )
    .bind(userId, email, phone, now, now)
    .run();
  await ensureProfile(env, userId, input, null);
  await ensurePreferences(env, userId);
  return {
    id: userId,
    telegram_user_id: null,
    email,
    phone,
    role: "user",
    status: "active",
    admin_locale: null,
  };
}
