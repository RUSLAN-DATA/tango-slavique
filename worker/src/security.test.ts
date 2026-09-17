import { describe, expect, it } from "vitest";
import { hmacSha256, hmacSha256Hex, timingSafeEqual } from "./crypto";
import { parseTelegramAdminIds, isTelegramAdmin } from "./telegram/adminIds";
import { validateTelegramInitData } from "./auth/telegramInitData";
import { validateApplicationInput } from "./applications/validate";
import { validatePhoto } from "./photos/validate";
import { calculateMatchScore } from "./matches/score";

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
