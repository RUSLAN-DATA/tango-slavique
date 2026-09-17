import type { Env } from "../env";

export function telegramBotUsername(env: Env): string {
  return (env.TELEGRAM_BOT_USERNAME || "Tangoslavique_bot").replace(/^@/, "");
}

export function miniAppHttpsUrl(env: Env, startParam?: string): string {
  const base = (env.MINIAPP_URL || "https://tango.bavariagloss.de/miniapp")
    .split("#")[0]
    .split("?")[0];
  if (!startParam) {
    return base;
  }
  return `${base}?startapp=${encodeURIComponent(startParam)}#${encodeURIComponent(startParam)}`;
}

/**
 * Telegram Direct Link to the Mini App. Inline web_app buttons only work in
 * private chats, so group messages use this t.me URL instead.
 */
export function miniAppStartLink(env: Env, startParam = "admin"): string {
  const username = telegramBotUsername(env);
  const shortName = env.TELEGRAM_MINIAPP_SHORT_NAME?.trim();
  const query = `?startapp=${encodeURIComponent(startParam)}`;
  if (shortName) {
    return `https://t.me/${username}/${shortName}${query}`;
  }
  return `https://t.me/${username}${query}`;
}

export function adminPanelButton(env: Env, kind: "web_app" | "url") {
  if (kind === "web_app") {
    return {
      text: "🛠 Admin Panel",
      web_app: { url: miniAppHttpsUrl(env, "admin") },
    };
  }
  return {
    text: "🛠 Admin Panel",
    url: miniAppStartLink(env, "admin"),
  };
}

export function applicationActionKeyboard(env: Env, applicationId: string) {
  return {
    inline_keyboard: [
      [
        { text: "👁 Open", url: miniAppStartLink(env, `app_${applicationId}`) },
        { text: "✅ Approve", callback_data: `y:${applicationId}` },
      ],
      [
        { text: "❌ Reject", callback_data: `n:${applicationId}` },
        { text: "ℹ️ Need info", callback_data: `i:${applicationId}` },
      ],
    ],
  };
}

export const ADMIN_HUB_TEXT = [
  "📋 TANGO SLAVIQUE ADMIN",
  "",
  "🛠 Admin Panel",
  "Open the full Admin Mini App. Every authorized administrator has the same access.",
].join("\n");

export function isAdminPanelCommand(text: string): boolean {
  return /^\/(admin|panel)(?:@\w+)?(?:\s|$)/i.test(text.trim());
}

export function parseMiniAppStartParam(value: string | undefined | null): {
  section: string;
  id: string;
} | null {
  const raw = (value || "").trim();
  if (!raw) {
    return null;
  }
  if (raw === "admin") {
    return { section: "dashboard", id: "" };
  }
  const match = raw.match(/^(app|prof|photo|match)_([A-Za-z0-9]+)$/);
  if (!match) {
    return { section: "dashboard", id: "" };
  }
  const map: Record<string, string> = {
    app: "applications",
    prof: "profiles",
    photo: "photos",
    match: "matches",
  };
  return { section: map[match[1]] || "dashboard", id: match[2] };
}
