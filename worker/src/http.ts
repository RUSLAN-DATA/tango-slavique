import type { Env } from "./env";

const HEALTH_CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export function json(
  data: unknown,
  status = 200,
  extraHeaders?: Record<string, string>
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

export function apiOk(data: unknown = {}, status = 200, extraHeaders?: Record<string, string>): Response {
  return json({ ok: true, data }, status, extraHeaders);
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  extraHeaders?: Record<string, string>
): Response {
  return json({ ok: false, error: { code, message } }, status, extraHeaders);
}

export function healthCorsHeaders(): Record<string, string> {
  return { ...HEALTH_CORS };
}

export function healthPreflight(): Response {
  return new Response(null, { status: 204, headers: HEALTH_CORS });
}

export function allowedOrigins(env: Env): string[] {
  const origins = [
    env.APP_ORIGIN || "https://tango.bavariagloss.de",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];
  return [...new Set(origins.filter(Boolean))];
}

export function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get("Origin") || "";
  const allow = allowedOrigins(env);
  const matched = allow.includes(origin) ? origin : allow[0];
  return {
    "Access-Control-Allow-Origin": matched,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function corsPreflight(request: Request, env: Env): Response {
  return new Response(null, { status: 204, headers: corsHeaders(request, env) });
}

export function methodNotAllowed(
  allow: string[],
  extraHeaders?: Record<string, string>
): Response {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: allow.join(", "), ...extraHeaders },
  });
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
