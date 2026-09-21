import type { Env } from "../env";
import { newId, nowIso } from "../crypto";
import { sendTelegramMessage } from "../telegram/api";

export const USER_MESSAGES: Record<string, string> = {
  application_submitted: "Thank you. We received your profile and will look at it personally.",
  application_approved: "Your application was approved. Welcome to Tango Slavique.",
  application_rejected: "Your application was not accepted this time.",
  application_info_requested: "We need a little more information about your profile.",
  profile_approved: "Your profile is now visible to the house.",
  photo_approved: "Your photo was approved.",
  photo_rejected: "Please add a clearer photo of you.",
  photo_info_requested: "Please send a new photo of you.",
  match_new: "The house has someone to introduce to you.",
  introduction_new: "The house has arranged an introduction for you.",
};

const DEDUPE_MS = 24 * 60 * 60 * 1000;

export async function listInAppNotifications(
  env: Env,
  userId: string | null,
  status?: string
) {
  const wanted = status === "read" || status === "archived" || status === "unread" ? status : "";
  if (userId) {
    if (wanted) {
      const rows = await env.DB.prepare(
        `SELECT id, user_id, channel, type, payload, status, created_at
         FROM notifications
         WHERE user_id = ? AND channel = 'in_app' AND status = ?
         ORDER BY created_at DESC LIMIT 50`
      )
        .bind(userId, wanted)
        .all();
      return rows.results || [];
    }
    const rows = await env.DB.prepare(
      `SELECT id, user_id, channel, type, payload, status, created_at
       FROM notifications
       WHERE user_id = ? AND channel = 'in_app' AND status != 'archived'
       ORDER BY created_at DESC LIMIT 50`
    )
      .bind(userId)
      .all();
    return rows.results || [];
  }
  if (wanted) {
    const rows = await env.DB.prepare(
      `SELECT id, user_id, channel, type, payload, status, created_at
       FROM notifications
       WHERE channel = 'in_app' AND status = ?
       ORDER BY created_at DESC LIMIT 50`
    )
      .bind(wanted)
      .all();
    return rows.results || [];
  }
  const rows = await env.DB.prepare(
    `SELECT id, user_id, channel, type, payload, status, created_at
     FROM notifications
     WHERE channel = 'in_app' AND status != 'archived'
     ORDER BY created_at DESC LIMIT 50`
  ).all();
  return rows.results || [];
}

export async function markNotificationRead(env: Env, id: string, userId?: string | null) {
  if (userId) {
    await env.DB.prepare(
      "UPDATE notifications SET status = 'read' WHERE id = ? AND user_id = ? AND channel = 'in_app'"
    )
      .bind(id, userId)
      .run();
    return;
  }
  await env.DB.prepare("UPDATE notifications SET status = 'read' WHERE id = ? AND channel = 'in_app'")
    .bind(id)
    .run();
}

export async function markAllNotificationsRead(env: Env, userId?: string | null) {
  if (userId) {
    await env.DB.prepare(
      "UPDATE notifications SET status = 'read' WHERE user_id = ? AND channel = 'in_app' AND status = 'unread'"
    )
      .bind(userId)
      .run();
    return;
  }
  await env.DB.prepare(
    "UPDATE notifications SET status = 'read' WHERE channel = 'in_app' AND status = 'unread'"
  ).run();
}

export async function notifyUser(
  env: Env,
  userId: string | null | undefined,
  type: string,
  payload: Record<string, unknown> = {}
): Promise<void> {
  if (!userId) {
    return;
  }
  const now = nowIso();
  const extra = typeof payload.message === "string" ? payload.message.trim() : "";
  if (type !== "application_info_requested") {
    const since = new Date(Date.now() - DEDUPE_MS).toISOString();
    const existing = await env.DB.prepare(
      `SELECT id FROM notifications
       WHERE user_id = ? AND type = ? AND channel = 'in_app' AND status != 'archived' AND created_at >= ?
       LIMIT 1`
    )
      .bind(userId, type, since)
      .first();
    if (existing) {
      return;
    }
  }
  await env.DB.prepare(
    `INSERT INTO notifications (id, user_id, channel, type, payload, status, created_at)
     VALUES (?, ?, 'in_app', ?, ?, 'unread', ?)`
  )
    .bind(newId(), userId, type, JSON.stringify(payload), now)
    .run()
    .catch(() => undefined);

  const important = USER_MESSAGES[type];
  if (!important) {
    return;
  }
  const text = extra ? `${important}\n\n${extra}` : important;
  const user = await env.DB.prepare(
    "SELECT telegram_user_id FROM users WHERE id = ?"
  )
    .bind(userId)
    .first<{ telegram_user_id: string | null }>();
  if (!user?.telegram_user_id) {
    return;
  }
  await sendTelegramMessage(env, user.telegram_user_id, text).catch(() => undefined);
}
