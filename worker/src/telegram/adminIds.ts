/**
 * Parse TELEGRAM_ADMIN_IDS as comma-separated numeric Telegram user IDs.
 * Invalid tokens are skipped.
 */
export function parseTelegramAdminIds(value: string | undefined): Set<string> {
  const ids = new Set<string>();
  if (!value) {
    return ids;
  }

  for (const part of value.split(",")) {
    const trimmed = part.trim();
    if (/^\d+$/.test(trimmed)) {
      ids.add(trimmed);
    }
  }

  return ids;
}

export function isTelegramAdmin(
  adminIds: Set<string>,
  userId: string | null
): boolean {
  return userId !== null && adminIds.has(userId);
}
