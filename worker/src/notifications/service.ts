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
  const user = await env.DB.prepare(
    "SELECT telegram_user_id FROM users WHERE id = ?"
  )
    .bind(userId)
    .first<{ telegram_user_id: string | null }>();
  if (!user?.telegram_user_id) {
    return;
  }
  await sendTelegramMessage(env, user.telegram_user_id, important).catch(() => undefined);
}
