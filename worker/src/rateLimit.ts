import type { Env } from "./env";

export async function enforceRateLimit(
  env: Env,
  key: string,
  limit: number,
  windowMs = 60_000
): Promise<boolean> {
  const now = Date.now();
  const row = await env.DB.prepare(
    "SELECT count, reset_at FROM rate_limits WHERE key = ?"
  )
    .bind(key)
    .first<{ count: number; reset_at: number }>();

  if (!row || row.reset_at <= now) {
    await env.DB.prepare(
      "INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = 1, reset_at = excluded.reset_at"
    )
      .bind(key, now + windowMs)
      .run();
    return true;
  }

  if (row.count >= limit) {
    return false;
  }

  await env.DB.prepare(
    "UPDATE rate_limits SET count = count + 1 WHERE key = ?"
  )
    .bind(key)
    .run();
  return true;
}
