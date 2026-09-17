import type { Env } from "./env";
import {
  apiError,
  clientIp,
  corsPreflight,
  healthCorsHeaders,
  healthPreflight,
  json,
  methodNotAllowed,
} from "./http";
import { enforceRateLimit } from "./rateLimit";
import { handleApi } from "./routes";
import { ensureTelegramRuntime } from "./telegram/setup";
import { handleTelegramWebhook } from "./telegram/webhook";

function healthResponse(): Response {
  return json(
    {
      ok: true,
      service: "tango-slavique-api",
    },
    200,
    healthCorsHeaders()
  );
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/api/health") {
      if (request.method === "GET") {
        ctx.waitUntil(ensureTelegramRuntime(env));
        return healthResponse();
      }
      if (request.method === "HEAD") {
        const response = healthResponse();
        return new Response(null, {
          status: response.status,
          headers: response.headers,
        });
      }
      if (request.method === "OPTIONS") {
        return healthPreflight();
      }
      return methodNotAllowed(["GET", "HEAD", "OPTIONS"], healthCorsHeaders());
    }

    if (request.method === "OPTIONS" && path.startsWith("/api/")) {
      return corsPreflight(request, env);
    }

    if (path === "/api/telegram/webhook") {
      if (request.method !== "POST") {
        return methodNotAllowed(["POST"]);
      }
      const allowed = await enforceRateLimit(
        env,
        `webhook:${clientIp(request)}`,
        120
      ).catch(() => true);
      if (!allowed) {
        return apiError("RATE_LIMITED", "Too many requests", 429);
      }
      return handleTelegramWebhook(request, env);
    }

    const limitedPaths: Record<string, number> = {
      "/api/auth/telegram": 20,
      "/api/applications": 60,
      "/api/photos": 15,
    };
    if (request.method !== "GET" && limitedPaths[path]) {
      const allowed = await enforceRateLimit(
        env,
        `${path}:${clientIp(request)}`,
        limitedPaths[path]
      ).catch(() => true);
      if (!allowed) {
        return apiError("RATE_LIMITED", "Too many requests", 429);
      }
    }

    const apiResponse = await handleApi(request, env, path);
    if (apiResponse) {
      return apiResponse;
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
