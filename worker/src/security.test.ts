import { describe, expect, it } from "vitest";
import { hmacSha256, hmacSha256Hex, timingSafeEqual } from "./crypto";
import { parseTelegramAdminIds, isTelegramAdmin } from "./telegram/adminIds";
import { validateTelegramInitData } from "./auth/telegramInitData";
import { validateApplicationInput } from "./applications/validate";
import { validatePhoto, detectImageType } from "./photos/validate";
import { calculateMatchScore } from "./matches/score";
import { handleTelegramWebhook } from "./telegram/webhook";
import type { Env } from "./env";

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
