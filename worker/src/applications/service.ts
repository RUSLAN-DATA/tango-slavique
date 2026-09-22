import type { Env } from "../env";
import { newId, nowIso } from "../crypto";
import { sendAdminMessage } from "../telegram/notifications";
import { applicationActionKeyboard } from "../telegram/miniAppLinks";
import { ageFromBirthDate } from "../profile/age";
import { notifyUser } from "../notifications/service";

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

function applicationKeyboard(env: Env, id: string) {
  return applicationActionKeyboard(env, id);
}

function phoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

export async function findReusableApplication(
  env: Env,
  input: { email?: string; phone?: string; userId?: string | null }
): Promise<ApplicationRow | null> {
  if (input.userId) {
    const byUser = await env.DB.prepare(
      `SELECT * FROM applications
       WHERE user_id = ? AND status IN ('new', 'info_requested', 'approved')
       ORDER BY created_at DESC LIMIT 1`
    )
      .bind(input.userId)
      .first<ApplicationRow>();
    if (byUser) {
      return byUser;
    }
  }

  const email = (input.email || "").trim().toLowerCase();
  const phone = phoneDigits(input.phone || "");
  if (!email && !phone) {
    return null;
  }

  return env.DB.prepare(
    `SELECT * FROM applications
     WHERE status IN ('new', 'info_requested', 'approved')
       AND (
         (? != '' AND lower(coalesce(email, '')) = ?)
         OR (? != '' AND replace(replace(replace(coalesce(phone, ''), ' ', ''), '-', ''), '+', '') = ?)
       )
     ORDER BY created_at DESC LIMIT 1`
  )
    .bind(email, email, phone, phone)
    .first<ApplicationRow>();
}

async function applicationNotice(env: Env, row: ApplicationRow): Promise<string> {
  let age = "";
  let photoCount = 0;
  if (row.user_id) {
    const profile = await env.DB.prepare(
      "SELECT birth_date FROM profiles WHERE user_id = ?"
    )
      .bind(row.user_id)
      .first<{ birth_date: string | null }>();
    const years = ageFromBirthDate(profile?.birth_date || null);
    if (years) age = String(years);
    const photos = await env.DB.prepare(
      "SELECT COUNT(*) as n FROM photos WHERE user_id = ?"
    )
      .bind(row.user_id)
      .first<{ n: number }>();
    photoCount = Number(photos?.n || 0);
  }
  return [
    "🆕 NEW APPLICATION",
    `Name: ${row.name || "—"}`,
    age ? `Age: ${age}` : "",
    `Location: ${row.city || "—"}`,
    `Photos: ${photoCount}`,
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
    reuse?: boolean;
  }
): Promise<{ application: ApplicationRow; notified: boolean; reused: boolean }> {
  const existing =
    input.reuse === false
      ? null
      : await findReusableApplication(env, {
          email: input.email,
          phone: input.phone,
          userId: input.userId,
        });
  if (existing) {
    console.log("applications.reuse", {
      id: existing.id,
      status: existing.status,
      source: input.source || "website",
      hasEmail: Boolean(input.email),
      hasPhone: Boolean(input.phone),
    });
    return { application: existing, notified: false, reused: true };
  }

  const now = nowIso();
  const id = newId();
  try {
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
  } catch (error) {
    console.error("applications.insert_failed", {
      source: input.source || "website",
      hasEmail: Boolean(input.email),
      hasPhone: Boolean(input.phone),
      hasCity: Boolean(input.city),
    });
    throw error;
  }

  const application = (await env.DB.prepare(
    "SELECT * FROM applications WHERE id = ?"
  )
    .bind(id)
    .first<ApplicationRow>())!;

  console.log("applications.create", {
    id: application.id,
    status: application.status,
    source: input.source || "website",
    hasEmail: Boolean(input.email),
    hasPhone: Boolean(input.phone),
    hasCity: Boolean(input.city),
  });

  let notified = false;
  if (input.silent) {
    return { application, notified, reused: false };
  }
  try {
    notified = await sendAdminMessage(env, await applicationNotice(env, application), {
      reply_markup: applicationKeyboard(env, id),
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

  return { application, notified, reused: false };
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
  adminTelegramId: string,
  infoMessage?: string
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
  const updated = await getApplication(env, id);
  if (updated?.user_id) {
    const type =
      status === "approved"
        ? "application_approved"
        : status === "rejected"
          ? "application_rejected"
          : "application_info_requested";
    await notifyUser(env, updated.user_id, type, {
      applicationId: id,
      message: infoMessage || "",
    });
    if (status === "approved") {
      await notifyUser(env, updated.user_id, "profile_approved", { applicationId: id });
    }
  }
  return updated;
}
