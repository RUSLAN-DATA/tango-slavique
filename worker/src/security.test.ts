import { describe, expect, it } from "vitest";
import { hmacSha256, hmacSha256Hex, timingSafeEqual } from "./crypto";
import { parseTelegramAdminIds, isTelegramAdmin } from "./telegram/adminIds";
import { validateTelegramInitData } from "./auth/telegramInitData";
import { validateApplicationInput } from "./applications/validate";
import { validatePhoto, detectImageType } from "./photos/validate";
import { calculateMatchScore } from "./matches/score";
import { handleTelegramWebhook } from "./telegram/webhook";
import type { Env } from "./env";
import { isAdminUser } from "./auth/session";
import {
  applicationActionKeyboard,
  adminPanelButton,
  isAdminPanelCommand,
  miniAppStartLink,
  parseMiniAppStartParam,
} from "./telegram/miniAppLinks";

describe("admin IDs", () => {
  it("parses comma-separated numeric IDs", () => {
    const ids = parseTelegramAdminIds("1881305255, 1591345305, abc, ");
    expect(ids.has("1881305255")).toBe(true);
    expect(ids.has("1591345305")).toBe(true);
    expect(ids.size).toBe(2);
  });

  it("detects admins and non-admins", () => {
    const ids = parseTelegramAdminIds("1881305255,1591345305");
    expect(isTelegramAdmin(ids, "1881305255")).toBe(true);
    expect(isTelegramAdmin(ids, "1")).toBe(false);
    expect(isTelegramAdmin(ids, null)).toBe(false);
  });

  it("grants the same access to every configured administrator", () => {
    const env = {
      TELEGRAM_ADMIN_IDS: "1881305255,1591345305",
    } as Env;
    const first = {
      id: "u1",
      telegram_user_id: "1881305255",
      email: null,
      phone: null,
      role: "user" as const,
      status: "active",
    };
    const second = {
      ...first,
      id: "u2",
      telegram_user_id: "1591345305",
    };
    const outsider = {
      ...first,
      id: "u3",
      telegram_user_id: "999",
      role: "admin" as const,
    };
    expect(isAdminUser(env, first)).toBe(true);
    expect(isAdminUser(env, second)).toBe(true);
    expect(isAdminUser(env, outsider)).toBe(false);
    expect(
      isAdminUser(env, { ...outsider, telegram_user_id: null, role: "admin" })
    ).toBe(false);
  });

  it("does not treat usernames as admin identifiers", () => {
    const ids = parseTelegramAdminIds("admin, @owner, 1881305255");
    expect(ids.has("1881305255")).toBe(true);
    expect(ids.has("admin")).toBe(false);
    expect(ids.has("@owner")).toBe(false);
  });
});

describe("webhook secret compare", () => {
  it("rejects missing or mismatched secrets", () => {
    expect(timingSafeEqual("abc", "")).toBe(false);
    expect(timingSafeEqual("abc", "abd")).toBe(false);
    expect(timingSafeEqual("secret", "secret")).toBe(true);
  });
});

describe("application validation", () => {
  it("requires a contact method", () => {
    const result = validateApplicationInput({ name: "" });
    expect("error" in result).toBe(true);
  });

  it("accepts a named phone application", () => {
    const result = validateApplicationInput({
      name: "Anna",
      phone: "+34600000000",
      city: "Barcelona",
    });
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.name).toBe("Anna");
      expect(result.phone).toBe("+34600000000");
    }
  });

  it("requires both a name and a contact method", () => {
    expect("error" in validateApplicationInput({ name: "Anna" })).toBe(true);
    expect("error" in validateApplicationInput({ phone: "+34600000000" })).toBe(
      true
    );
  });
});

describe("photo validation", () => {
  it("accepts jpeg under the size limit", () => {
    const result = validatePhoto({ type: "image/jpeg", size: 1024 });
    expect(result.ok).toBe(true);
  });

  it("rejects gif and oversized files", () => {
    expect(validatePhoto({ type: "image/gif", size: 100 }).ok).toBe(false);
    expect(validatePhoto({ type: "image/png", size: 11 * 1024 * 1024 }).ok).toBe(
      false
    );
  });

  it("detects jpeg png and webp magic bytes", () => {
    expect(detectImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer)?.ext).toBe(
      "jpg"
    );
    expect(
      detectImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).buffer)
        ?.ext
    ).toBe("png");
    const webp = new Uint8Array(12);
    webp.set([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
    expect(detectImageType(webp.buffer)?.ext).toBe("webp");
    expect(detectImageType(new Uint8Array([0x47, 0x49, 0x46]).buffer)).toBeNull();
  });
});

describe("matching score", () => {
  it("scores overlapping preferences", () => {
    const score = calculateMatchScore(
      {
        userId: "a",
        gender: "woman",
        birthDate: "1995-01-01",
        city: "Barcelona",
        country: "ES",
        maritalStatus: "single",
        children: "no",
        languages: "en, ru",
      },
      {
        gender: "woman",
        ageMin: 25,
        ageMax: 40,
        city: "Barcelona",
        maritalStatus: "single",
        children: "no",
        languages: "ru",
        intent: "relationship",
      }
    );
    expect(score).toBe(100);
  });
});

describe("telegram initData", () => {
  it("validates a correctly signed payload", async () => {
    const botToken = "123456:TESTTOKEN";
    const user = JSON.stringify({ id: 1881305255, first_name: "Admin" });
    const authDate = String(Math.floor(Date.now() / 1000));
    const params = new URLSearchParams({
      auth_date: authDate,
      query_id: "AAE",
      user,
    });
    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");
    const secretKey = await hmacSha256(
      new TextEncoder().encode("WebAppData"),
      botToken
    );
    const hash = await hmacSha256Hex(secretKey, dataCheckString);
    params.set("hash", hash);

    const result = await validateTelegramInitData(botToken, params.toString());
    expect(result.user.id).toBe(1881305255);
    expect(result.startParam).toBe("");
  });

  it("extracts start_param without trusting it for admin rights", async () => {
    const botToken = "123456:TESTTOKEN";
    const user = JSON.stringify({ id: 42, first_name: "Member" });
    const authDate = String(Math.floor(Date.now() / 1000));
    const params = new URLSearchParams({
      auth_date: authDate,
      query_id: "AAE",
      start_param: "admin",
      chat_type: "supergroup",
      user,
    });
    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");
    const secretKey = await hmacSha256(
      new TextEncoder().encode("WebAppData"),
      botToken
    );
    const hash = await hmacSha256Hex(secretKey, dataCheckString);
    params.set("hash", hash);

    const result = await validateTelegramInitData(botToken, params.toString());
    expect(result.user.id).toBe(42);
    expect(result.startParam).toBe("admin");
    expect(result.chatType).toBe("supergroup");
    const env = { TELEGRAM_ADMIN_IDS: "1881305255,1591345305" } as Env;
    expect(
      isAdminUser(env, {
        id: "u",
        telegram_user_id: String(result.user.id),
        email: null,
        phone: null,
        role: "user",
        status: "active",
      })
    ).toBe(false);
  });

  it("rejects a tampered payload", async () => {
    await expect(
      validateTelegramInitData(
        "123456:TESTTOKEN",
        "auth_date=1&hash=deadbeef&user=%7B%22id%22%3A1%7D"
      )
    ).rejects.toThrow("INVALID_INIT_DATA");
  });
});

describe("telegram webhook", () => {
  const env = {
    TELEGRAM_WEBHOOK_SECRET: "expected-secret",
  } as Env;

  it("rejects requests without the secret header", async () => {
    const response = await handleTelegramWebhook(
      new Request("https://example.com/api/telegram/webhook", {
        method: "POST",
        body: "{}",
      }),
      env
    );
    expect(response.status).toBe(401);
  });

  it("rejects requests with the wrong secret", async () => {
    const response = await handleTelegramWebhook(
      new Request("https://example.com/api/telegram/webhook", {
        method: "POST",
        headers: { "X-Telegram-Bot-Api-Secret-Token": "wrong" },
        body: "{}",
      }),
      env
    );
    expect(response.status).toBe(401);
  });

  it("accepts a valid secret and empty update", async () => {
    const response = await handleTelegramWebhook(
      new Request("https://example.com/api/telegram/webhook", {
        method: "POST",
        headers: { "X-Telegram-Bot-Api-Secret-Token": "expected-secret" },
        body: JSON.stringify({ update_id: 1 }),
      }),
      env
    );
    expect(response.status).toBe(200);
  });

  it("ignores ordinary group chatter from non-admins", async () => {
    const groupEnv = {
      TELEGRAM_WEBHOOK_SECRET: "expected-secret",
      TELEGRAM_ADMIN_IDS: "1881305255,1591345305",
      TELEGRAM_ADMIN_CHAT_ID: "-100123",
    } as Env;
    const response = await handleTelegramWebhook(
      new Request("https://example.com/api/telegram/webhook", {
        method: "POST",
        headers: { "X-Telegram-Bot-Api-Secret-Token": "expected-secret" },
        body: JSON.stringify({
          update_id: 2,
          message: {
            message_id: 10,
            text: "hello everyone",
            from: { id: 999 },
            chat: { id: -100123, type: "supergroup" },
          },
        }),
      }),
      groupEnv
    );
    expect(response.status).toBe(200);
  });

  it("does not reply when a non-admin uses /admin in the group", async () => {
    const groupEnv = {
      TELEGRAM_WEBHOOK_SECRET: "expected-secret",
      TELEGRAM_ADMIN_IDS: "1881305255,1591345305",
      TELEGRAM_ADMIN_CHAT_ID: "-100123",
    } as Env;
    const response = await handleTelegramWebhook(
      new Request("https://example.com/api/telegram/webhook", {
        method: "POST",
        headers: { "X-Telegram-Bot-Api-Secret-Token": "expected-secret" },
        body: JSON.stringify({
          update_id: 3,
          message: {
            message_id: 11,
            text: "/admin",
            from: { id: 999 },
            chat: { id: -100123, type: "supergroup" },
          },
        }),
      }),
      groupEnv
    );
    expect(response.status).toBe(200);
  });
});

describe("admin panel links", () => {
  const env = {
    TELEGRAM_BOT_USERNAME: "Tangoslavique_bot",
    MINIAPP_URL: "https://tango.bavariagloss.de/miniapp",
  } as Env;

  it("builds a Telegram Mini App link for every administrator", () => {
    expect(miniAppStartLink(env, "admin")).toBe(
      "https://t.me/Tangoslavique_bot?startapp=admin"
    );
    expect(isAdminPanelCommand("/admin")).toBe(true);
    expect(isAdminPanelCommand("/panel@Tangoslavique_bot")).toBe(true);
    expect(isAdminPanelCommand("hello")).toBe(false);
  });

  it("uses a URL Open button so all admins can open the Mini App from the group", () => {
    const keyboard = applicationActionKeyboard(env, "abc123def4567890");
    const open = keyboard.inline_keyboard[0][0] as { text: string; url?: string };
    expect(open.text).toBe("👁 Open");
    expect(open.url).toContain("startapp=app_abc123def4567890");
    const urlButton = adminPanelButton(env, "url") as { url: string };
    const webButton = adminPanelButton(env, "web_app") as { web_app: { url: string } };
    expect(urlButton.url).toContain("startapp=admin");
    expect(webButton.web_app.url).toContain("startapp=admin");
  });

  it("parses Mini App start params", () => {
    expect(parseMiniAppStartParam("photo_aa11")).toEqual({
      section: "photos",
      id: "aa11",
    });
  });
});

describe("locale detection", () => {
  it("detects spanish and english", async () => {
    const { detectLocale, otherLocale } = await import("./blog/language");
    expect(detectLocale("Hoy queremos compartir una historia de amor")).toBe("es");
    expect(detectLocale("Today we want to share a story about love")).toBe("en");
    expect(otherLocale("en")).toBe("es");
  });
});

describe("admin caption intent", () => {
  it("classifies blog, attach and new profile", async () => {
    const { parseAdminCaption } = await import("./telegram/intent");
    expect(
      parseAdminCaption(
        "Today we want to share a long enough journal paragraph about the house and discretion.",
        true
      ).type
    ).toBe("blog");
    expect(parseAdminCaption("Maria profile photo", true)).toEqual({
      type: "attach",
      name: "Maria",
    });
    expect(parseAdminCaption("New profile Elena", true)).toEqual({
      type: "new_profile",
      name: "Elena",
    });
  });
});

describe("age helpers", () => {
  it("converts age to a birth year", async () => {
    const { birthDateFromAge, ageFromBirthDate } = await import("./profile/age");
    expect(birthDateFromAge(27).startsWith(String(new Date().getFullYear() - 27))).toBe(
      true
    );
    expect(ageFromBirthDate(`${new Date().getFullYear() - 30}-01-01`)).toBe(30);
  });
});

describe("public photo view", () => {
  it("hides storage keys and technical statuses", async () => {
    const { publicPhotoView } = await import("./photos/service");
    const view = publicPhotoView({
      id: "abc",
      user_id: "user1",
      r2_key: "users/user1/abc.jpg",
      original_name: "secret.jpg",
      mime_type: "image/jpeg",
      size: 1200,
      sort_order: 0,
      status: "pending",
      created_at: "2026-01-01T00:00:00.000Z",
      is_primary: 1,
    });
    expect(view).not.toHaveProperty("r2_key");
    expect(view).not.toHaveProperty("original_name");
    expect(view.status).toBe("saved");
    expect(view.is_primary).toBe(true);
  });
});

describe("annotation overlay", () => {
  it("builds a png with a review box", async () => {
    const { buildAnnotationPng } = await import("./photos/annotate");
    const png = await buildAnnotationPng([{ x: 10, y: 10, w: 40, h: 50, label: "person" }]);
    expect(png[0]).toBe(137);
    expect(png[1]).toBe(80);
    expect(png[2]).toBe(78);
    expect(png[3]).toBe(71);
    expect(png.length).toBeGreaterThan(80);
  });
});

describe("gemini fallback", () => {
  it("returns null without an api key", async () => {
    const { geminiGenerateJson, textPart } = await import("./ai/gemini");
    const result = await geminiGenerateJson(
      { GEMINI_API_KEY: "" } as Env,
      [textPart("hi")],
      "system"
    );
    expect(result).toBeNull();
  });
});
