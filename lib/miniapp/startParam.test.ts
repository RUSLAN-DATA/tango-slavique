import { describe, expect, it } from "vitest";
import { parseMiniAppStartParam, wantsAdminMode } from "./startParam";

describe("mini app start param", () => {
  it("opens the dashboard for admin", () => {
    expect(parseMiniAppStartParam("admin")).toEqual({ section: "dashboard", id: "" });
  });

  it("opens application and profile deep links", () => {
    expect(parseMiniAppStartParam("app_abc123")).toEqual({
      section: "applications",
      id: "abc123",
    });
    expect(parseMiniAppStartParam("prof_user1")).toEqual({
      section: "profiles",
      id: "user1",
    });
  });
});

describe("admin mode", () => {
  it("enables admin mode for every authorized administrator", () => {
    expect(
      wantsAdminMode({ role: "admin", startParam: "admin", chatType: "private" })
    ).toBe(true);
    expect(
      wantsAdminMode({ role: "admin", startParam: "", chatType: "supergroup" })
    ).toBe(true);
  });

  it("does not enable admin mode from URL or group context alone", () => {
    expect(
      wantsAdminMode({ role: "user", startParam: "admin", chatType: "supergroup" })
    ).toBe(false);
    expect(
      wantsAdminMode({ role: "admin", startParam: "", chatType: "private" })
    ).toBe(false);
  });
});
