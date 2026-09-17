import type { Env } from "../env";
import { newId, nowIso } from "../crypto";
import { ageFromBirthDate } from "../profile/age";
import { listPhotos } from "../photos/service";
import { sendTelegramMessage, sendTelegramPhotoFile } from "./api";
import { sendAdminMessage } from "./notifications";

export async function sendProfileCard(
  env: Env,
  chatId: number | string,
  userId: string
): Promise<void> {
  const profile = await env.DB.prepare(
    "SELECT * FROM profiles WHERE user_id = ? OR id = ?"
  )
    .bind(userId, userId)
    .first<Record<string, unknown>>();
  if (!profile) {
    await sendTelegramMessage(env, chatId, "Profile not found.");
    return;
  }
  const uid = String(profile.user_id);
  const prefs = await env.DB.prepare(
    "SELECT gender, intent, city FROM partner_preferences WHERE user_id = ?"
  )
    .bind(uid)
    .first<{ gender: string | null; intent: string | null; city: string | null }>();
  const photos = await listPhotos(env, uid);
  const age = ageFromBirthDate(typeof profile.birth_date === "string" ? profile.birth_date : null);
  const name = String(profile.first_name || "Member");
  const text = [
    `👩 ${name}${age ? `, ${age}` : ""}`,
    `📍 ${profile.city || prefs?.city || "—"}`,
    prefs?.intent ? `❤️ Looking for: ${prefs.intent}` : "",
    profile.about ? `📝 ${(profile.about as string).slice(0, 400)}` : "",
    `📸 ${photos.length} photos`,
  ]
    .filter(Boolean)
    .join("\n");

  await sendTelegramMessage(env, chatId, text, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ Approve", callback_data: `p:y:${uid}` },
          { text: "❌ Reject", callback_data: `p:n:${uid}` },
        ],
        [
          { text: "📸 Photos", callback_data: `p:ph:${uid}` },
          { text: "💬 Ask question", callback_data: `p:i:${uid}` },
        ],
        [{ text: "🙈 Hide", callback_data: `p:h:${uid}` }],
      ],
    },
  });

  const primary = photos.find((photo) => photo.sort_order === 0) || photos[0];
  if (primary) {
    const object = await env.PHOTOS.get(primary.r2_key);
    if (object) {
      await sendTelegramPhotoFile(
        env,
        chatId,
        await object.arrayBuffer(),
        "photo.jpg",
        primary.mime_type
      ).catch(() => undefined);
    }
  }
}

export async function notifyNewProfile(
  env: Env,
  userId: string
): Promise<boolean> {
  const profile = await env.DB.prepare(
    "SELECT first_name, birth_date, city, about FROM profiles WHERE user_id = ?"
  )
    .bind(userId)
    .first<{
      first_name: string | null;
      birth_date: string | null;
      city: string | null;
      about: string | null;
    }>();
  const prefs = await env.DB.prepare(
    "SELECT intent FROM partner_preferences WHERE user_id = ?"
  )
    .bind(userId)
    .first<{ intent: string | null }>();
  const photos = await listPhotos(env, userId);
  const age = ageFromBirthDate(profile?.birth_date || null);
  const text = [
    "🆕 NEW PROFILE",
    `👩 ${profile?.first_name || "Member"}${age ? `, ${age}` : ""}`,
    `📍 ${profile?.city || "—"}`,
    prefs?.intent ? `❤️ Looking for: ${prefs.intent}` : "",
    profile?.about ? `📝 ${profile.about.slice(0, 240)}` : "",
    `📸 ${photos.length} photos`,
  ]
    .filter(Boolean)
    .join("\n");
  return sendAdminMessage(env, text, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "👀 View", callback_data: `p:v:${userId}` },
          { text: "✅ Approve", callback_data: `p:y:${userId}` },
        ],
        [
          { text: "❌ Reject", callback_data: `p:n:${userId}` },
          { text: "💬 Need info", callback_data: `p:i:${userId}` },
        ],
      ],
    },
  });
}

export async function setProfileVisibility(
  env: Env,
  userId: string,
  status: "public" | "hidden" | "draft" | "pending"
) {
  await env.DB.prepare("UPDATE profiles SET status = ?, updated_at = ? WHERE user_id = ?")
    .bind(status, nowIso(), userId)
    .run();
}

export async function findProfilesByName(env: Env, name: string) {
  const rows = await env.DB.prepare(
    `SELECT user_id, first_name, city, status FROM profiles
     WHERE lower(first_name) LIKE ? ORDER BY updated_at DESC LIMIT 8`
  )
    .bind(`%${name.trim().toLowerCase()}%`)
    .all<{ user_id: string; first_name: string | null; city: string | null; status: string }>();
  return rows.results || [];
}

export async function createNamedDraftProfile(env: Env, name: string) {
  const now = nowIso();
  const userId = newId();
  await env.DB.prepare(
    `INSERT INTO users (id, telegram_user_id, email, phone, role, status, created_at, updated_at)
     VALUES (?, NULL, NULL, NULL, 'user', 'active', ?, ?)`
  )
    .bind(userId, now, now)
    .run();
  await env.DB.prepare(
    `INSERT INTO profiles (id, user_id, first_name, status, created_at, updated_at)
     VALUES (?, ?, ?, 'draft', ?, ?)`
  )
    .bind(newId(), userId, name.slice(0, 80), now, now)
    .run();
  return userId;
}
