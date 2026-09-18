import type { Env } from "../env";
import { nowIso } from "../crypto";

export type AdminWorkflow = {
  admin_telegram_id: string;
  workflow: string;
  step: string;
  draft_id: string | null;
  extra: string | null;
  updated_at: string;
};

export async function getWorkflow(
  env: Env,
  adminTelegramId: string
): Promise<AdminWorkflow | null> {
  return env.DB.prepare(
    "SELECT * FROM admin_workflows WHERE admin_telegram_id = ?"
  )
    .bind(adminTelegramId)
    .first<AdminWorkflow>();
}

export async function setWorkflow(
  env: Env,
  adminTelegramId: string,
  input: {
    workflow: string;
    step: string;
    draftId?: string | null;
    extra?: Record<string, unknown> | null;
  }
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO admin_workflows (admin_telegram_id, workflow, step, draft_id, extra, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(admin_telegram_id) DO UPDATE SET
       workflow = excluded.workflow,
       step = excluded.step,
       draft_id = excluded.draft_id,
       extra = excluded.extra,
       updated_at = excluded.updated_at`
  )
    .bind(
      adminTelegramId,
      input.workflow,
      input.step,
      input.draftId ?? null,
      input.extra ? JSON.stringify(input.extra) : null,
      nowIso()
    )
    .run();
}

export async function clearWorkflow(env: Env, adminTelegramId: string): Promise<void> {
  await env.DB.prepare("DELETE FROM admin_workflows WHERE admin_telegram_id = ?")
    .bind(adminTelegramId)
    .run();
}

export function workflowExtra(row: AdminWorkflow | null): Record<string, string> {
  if (!row?.extra) {
    return {};
  }
  try {
    const parsed = JSON.parse(row.extra) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}
