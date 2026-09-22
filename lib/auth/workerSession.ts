export const WORKER_SESSION_COOKIE = "ts_worker_session";
export const WORKER_SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export function workerSessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: WORKER_SESSION_MAX_AGE,
  };
}

export function applyFormRedirect(
  pathname: string,
  hasWorkerSession: boolean
): string | null {
  if (hasWorkerSession) {
    return null;
  }
  if (pathname === "/apply/men/form") {
    return "/register?role=MAN";
  }
  if (pathname === "/apply/women/form") {
    return "/register?role=WOMAN";
  }
  return null;
}

export function registerSuccessPath(track: string): string {
  if (track === "WOMAN") {
    return "/apply/women/form";
  }
  if (track === "MAN") {
    return "/apply/men/form";
  }
  return "/";
}

export function bearerHeaders(token: string, extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("Authorization", `Bearer ${token}`);
  return headers;
}
