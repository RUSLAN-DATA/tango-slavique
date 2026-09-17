const WORKER_URL =
  process.env.NEXT_PUBLIC_WORKER_URL ||
  process.env.WORKER_URL ||
  "https://tango-slavique-api.4507208.workers.dev";

export type ApiError = {
  code: string;
  message: string;
};

export type ApiResult<T> = {
  ok: boolean;
  data?: T;
  error?: ApiError;
  status: number;
};

function tokenStorageKey() {
  return "ts_miniapp_token";
}

export function getSessionToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(tokenStorageKey());
}

export function setSessionToken(token: string | null) {
  if (typeof window === "undefined") {
    return;
  }
  if (!token) {
    window.localStorage.removeItem(tokenStorageKey());
    return;
  }
  window.localStorage.setItem(tokenStorageKey(), token);
}

export async function workerRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<ApiResult<T>> {
  const headers = new Headers(init.headers);
  const token = getSessionToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!(init.body instanceof FormData) && !headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${WORKER_URL}${path}`, {
    ...init,
    headers,
  });

  const contentType = response.headers.get("Content-Type") || "";
  if (!contentType.includes("application/json")) {
    return {
      ok: response.ok,
      status: response.status,
      data: undefined,
      error: response.ok
        ? undefined
        : { code: "HTTP_ERROR", message: "Unexpected response" },
    };
  }

  const payload = (await response.json()) as {
    ok?: boolean;
    data?: T;
    error?: ApiError;
  };
  return {
    ok: Boolean(payload.ok),
    status: response.status,
    data: payload.data,
    error: payload.error,
  };
}

export { WORKER_URL };
