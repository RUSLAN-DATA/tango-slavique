import type { Env } from "../env";
import { newId, nowIso } from "../crypto";
import { sendAdminMessage } from "../telegram/notifications";

export const APPLICATION_STATUSES = [
  "new",
  "info_requested",
  "approved",
  "rejected",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type ApplicationRow = {
  id: string;
  user_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  message: string | null;
  source: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

function applicationKeyboard(id: string) {
  return {
    inline_keyboard: [
      [
        { text: "👀 View", callback_data: `o:${id}` },
        { text: "✅ Approve", callback_data: `y:${id}` },
      ],
      [
        { text: "❌ Reject", callback_data: `n:${id}` },
        { text: "💬 Need info", callback_data: `i:${id}` },
      ],
    ],
  };
}

function applicationNotice(row: ApplicationRow): string {
  return [
    "🆕 NEW PROFILE",
    `👩 ${row.name || "Application"}`,
    `📍 ${row.city || "—"}`,
    row.message ? `📝 ${row.message.slice(0, 240)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function createApplication(
  env: Env,
  input: {
    name: string;
    email: string;
    phone: string;
    city: string;
    message: string;
    source: string;
    userId?: string | null;
    silent?: boolean;
  }
): Promise<{ application: ApplicationRow; notified: boolean }> {
  const now = nowIso();
  const id = newId();
  await env.DB.prepare(
    `INSERT INTO applications
      (id, user_id, name, email, phone, city, message, source, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`
  )
    .bind(
      id,
      input.userId || null,
      input.name || null,
      input.email || null,
      input.phone || null,
      input.city || null,
      input.message || null,
      input.source || "website",
      now,
      now
    )
    .run();

  const application = (await env.DB.prepare(
    "SELECT * FROM applications WHERE id = ?"
  )
    .bind(id)
    .first<ApplicationRow>())!;

  let notified = false;
  if (input.silent) {
    return { application, notified };
  }
  try {
    notified = await sendAdminMessage(env, applicationNotice(application), {
      reply_markup: applicationKeyboard(id),
    });
    await env.DB.prepare(
      `INSERT INTO notifications (id, user_id, channel, type, payload, status, created_at)
       VALUES (?, NULL, 'telegram', 'application_new', ?, ?, ?)`
    )
      .bind(
        newId(),
        JSON.stringify({ applicationId: id }),
        notified ? "sent" : "failed",
        now
      )
      .run();
  } catch {
    await env.DB.prepare(
      `INSERT INTO notifications (id, user_id, channel, type, payload, status, created_at)
       VALUES (?, NULL, 'telegram', 'application_new', ?, 'failed', ?)`
    )
      .bind(newId(), JSON.stringify({ applicationId: id }), now)
      .run();
    notified = false;
  }

  return { application, notified };
}

export async function getApplication(
  env: Env,
  id: string
): Promise<ApplicationRow | null> {
  return env.DB.prepare("SELECT * FROM applications WHERE id = ?")
    .bind(id)
    .first<ApplicationRow>();
}

export async function listApplications(
  env: Env,
  status?: string
): Promise<ApplicationRow[]> {
  if (status) {
    const result = await env.DB.prepare(
      "SELECT * FROM applications WHERE status = ? ORDER BY created_at DESC LIMIT 100"
    )
      .bind(status)
      .all<ApplicationRow>();
    return result.results || [];
  }
  const result = await env.DB.prepare(
    "SELECT * FROM applications ORDER BY created_at DESC LIMIT 100"
  ).all<ApplicationRow>();
  return result.results || [];
}

export async function updateApplicationStatus(
  env: Env,
  id: string,
  status: ApplicationStatus,
  adminTelegramId: string
): Promise<ApplicationRow | null> {
  const now = nowIso();
  await env.DB.prepare(
    "UPDATE applications SET status = ?, updated_at = ? WHERE id = ?"
  )
    .bind(status, now, id)
    .run();
  await env.DB.prepare(
    `INSERT INTO admin_actions (id, admin_telegram_id, action, entity_type, entity_id, created_at)
     VALUES (?, ?, ?, 'application', ?, ?)`
  )
    .bind(newId(), adminTelegramId, status, id, now)
    .run();
  return getApplication(env, id);
}
