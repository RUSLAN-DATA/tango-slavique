import type { Env } from "../env";
import { newId, nowIso } from "../crypto";
import {
  getApplication,
  updateApplicationStatus,
  type ApplicationStatus,
} from "../applications/service";
import { isTelegramAdmin, parseTelegramAdminIds } from "./adminIds";
import { answerTelegramCallbackQuery, sendTelegramMessage } from "./api";

type CallbackAction = "o" | "y" | "n" | "i";

function parseCallback(data: string): { action: CallbackAction; id: string } | null {
  const match = data.match(/^([oyni]):([a-f0-9]{8,32})$/i);
  if (!match) {
    return null;
  }
  return { action: match[1].toLowerCase() as CallbackAction, id: match[2] };
}

function statusForAction(action: CallbackAction): ApplicationStatus | null {
  if (action === "y") return "approved";
  if (action === "n") return "rejected";
  if (action === "i") return "info_requested";
  return null;
}

export async function handleAdminCallback(
  env: Env,
  fromId: string,
  callbackId: string,
  data: string,
  replyChatId: number | string | null
): Promise<void> {
  const admins = parseTelegramAdminIds(env.TELEGRAM_ADMIN_IDS);
  if (!isTelegramAdmin(admins, fromId)) {
    await answerTelegramCallbackQuery(env, callbackId, "Недостаточно прав.");
    return;
  }

  const parsed = parseCallback(data);
  if (!parsed) {
    await answerTelegramCallbackQuery(env, callbackId, "Некорректные данные.");
    return;
  }

  const application = await getApplication(env, parsed.id);
  if (!application) {
    await answerTelegramCallbackQuery(env, callbackId, "Заявка не найдена.");
    return;
  }

  if (parsed.action === "o") {
    await answerTelegramCallbackQuery(env, callbackId, "Открыто");
    if (replyChatId !== null) {
      await sendTelegramMessage(
        env,
        replyChatId,
        [
          `Заявка ${application.id}`,
          `Имя: ${application.name || "—"}`,
          `Город: ${application.city || "—"}`,
          `Email: ${application.email || "—"}`,
          `Телефон: ${application.phone || "—"}`,
          `Сообщение: ${application.message || "—"}`,
          `Status: ${application.status.toUpperCase()}`,
        ].join("\n")
      );
    }
    return;
  }

  const status = statusForAction(parsed.action);
  if (!status) {
    await answerTelegramCallbackQuery(env, callbackId);
    return;
  }

  await updateApplicationStatus(env, application.id, status, fromId);
  if (status === "approved" && application.user_id) {
    await env.DB.prepare(
      "UPDATE profiles SET status = 'public', updated_at = ? WHERE user_id = ?"
    )
      .bind(nowIso(), application.user_id)
      .run();
  }

  await env.DB.prepare(
    `INSERT INTO admin_actions (id, admin_telegram_id, action, entity_type, entity_id, created_at)
     VALUES (?, ?, ?, 'application_callback', ?, ?)`
  )
    .bind(newId(), fromId, parsed.action, application.id, nowIso())
    .run();

  const labels: Record<ApplicationStatus, string> = {
    new: "NEW",
    approved: "одобрена",
    rejected: "отклонена",
    info_requested: "нужна информация",
  };
  await answerTelegramCallbackQuery(env, callbackId, `Заявка ${labels[status]}`);
  if (replyChatId !== null) {
    await sendTelegramMessage(
      env,
      replyChatId,
      `Заявка ${application.id}: ${labels[status]}.`
    );
  }
}
