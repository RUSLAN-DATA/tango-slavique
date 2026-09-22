import { describe, expect, it } from "vitest";
import {
  applyFormRedirect,
  bearerHeaders,
  registerSuccessPath,
  workerSessionCookieOptions,
  WORKER_SESSION_COOKIE,
} from "./workerSession";

describe("website worker session helpers", () => {
  it("sets Worker cookie options", () => {
    const options = workerSessionCookieOptions(true);
    expect(WORKER_SESSION_COOKIE).toBe("ts_worker_session");
    expect(options).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
    expect(workerSessionCookieOptions(false).secure).toBe(false);
  });

  it("redirects registration by MAN/WOMAN", () => {
    expect(registerSuccessPath("MAN")).toBe("/apply/men/form");
    expect(registerSuccessPath("WOMAN")).toBe("/apply/women/form");
  });

  it("blocks the wizard when the Worker cookie is missing", () => {
    expect(applyFormRedirect("/apply/men/form", false)).toBe("/register?role=MAN");
    expect(applyFormRedirect("/apply/women/form", false)).toBe("/register?role=WOMAN");
    expect(applyFormRedirect("/apply/men/form", true)).toBeNull();
    expect(applyFormRedirect("/apply/women/form", true)).toBeNull();
  });

  it("sends Bearer on Worker proxy headers", () => {
    const headers = bearerHeaders("raw-token");
    expect(headers.get("Authorization")).toBe("Bearer raw-token");
  });
});
