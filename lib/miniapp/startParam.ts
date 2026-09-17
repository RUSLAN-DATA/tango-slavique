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

export function wantsAdminMode(input: {
  role?: string;
  startParam?: string;
  chatType?: string;
}): boolean {
  if (input.role !== "admin") {
    return false;
  }
  const param = (input.startParam || "").trim();
  const chatType = input.chatType || "";
  if (chatType === "group" || chatType === "supergroup") {
    return true;
  }
  if (!param) {
    return false;
  }
  return (
    param === "admin" ||
    /^(app|prof|photo|match)_/.test(param)
  );
}

export function readClientStartContext(): { startParam: string; chatType: string } {
  if (typeof window === "undefined") {
    return { startParam: "", chatType: "" };
  }
  const unsafe = window.Telegram?.WebApp?.initDataUnsafe;
  const fromTelegram = typeof unsafe?.start_param === "string" ? unsafe.start_param : "";
  const chatType =
    typeof unsafe?.chat_type === "string"
      ? unsafe.chat_type
      : typeof unsafe?.chat?.type === "string"
        ? unsafe.chat.type
        : "";
  const query = new URLSearchParams(window.location.search);
  const fromQuery = query.get("startapp") || query.get("tgWebAppStartParam") || "";
  const fromHash = window.location.hash.replace(/^#/, "");
  const startParam = [fromTelegram, fromQuery, fromHash].find((item) =>
    /^[A-Za-z0-9_-]{1,64}$/.test(item)
  ) || "";
  return { startParam, chatType };
}
