import { cookies } from "next/headers";
import { WORKER_SESSION_COOKIE, bearerHeaders } from "@/lib/auth/workerSession";

export function workerBaseUrl() {
  return (
    process.env.WORKER_URL ||
    process.env.NEXT_PUBLIC_WORKER_URL ||
    "https://tango-slavique-api.4507208.workers.dev"
  );
}

export function readWorkerSessionToken(): string | null {
  return cookies().get(WORKER_SESSION_COOKIE)?.value || null;
}

export async function workerBff<T = Record<string, unknown>>(
  path: string,
  token: string,
  init: RequestInit = {}
): Promise<{
  ok: boolean;
  status: number;
  data?: T;
  error?: { code?: string; message?: string };
  response: Response;
}> {
  const headers = bearerHeaders(token, init.headers);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${workerBaseUrl()}${path}`, {
    ...init,
    headers,
  });
  const contentType = response.headers.get("Content-Type") || "";
  if (!contentType.includes("application/json")) {
    return {
      ok: response.ok,
      status: response.status,
      response,
    };
  }
  const payload = (await response.json()) as {
    ok?: boolean;
    data?: T;
    error?: { code?: string; message?: string };
  };
  return {
    ok: Boolean(payload.ok),
    status: response.status,
    data: payload.data,
    error: payload.error,
    response,
  };
}
