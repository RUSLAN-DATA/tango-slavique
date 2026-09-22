import { NextRequest, NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import {
  WORKER_SESSION_COOKIE,
  workerSessionCookieOptions,
} from "@/lib/auth/workerSession";
import { workerBaseUrl } from "@/lib/worker/bff";

export async function POST(request: NextRequest) {
  const limited = rateLimit(clientKey(request, "register"), 8, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { success: false, error: "Too many attempts" },
      { status: 429 }
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const trackRaw = typeof body.track === "string" ? body.track.toUpperCase() : "";
    const track = trackRaw === "MAN" || trackRaw === "WOMAN" ? trackRaw : "";

    const workerResponse = await fetch(`${workerBaseUrl()}/api/auth/web/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        firstName,
        lastName,
        phone: phone || undefined,
        track: track || undefined,
      }),
    });
    const payload = (await workerResponse.json().catch(() => null)) as {
      ok?: boolean;
      data?: { token?: string; userId?: string; track?: string | null };
      error?: { message?: string };
    } | null;

    if (!workerResponse.ok || !payload?.ok || !payload.data?.token) {
      return NextResponse.json(
        {
          success: false,
          error: payload?.error?.message || "Unable to register",
        },
        { status: workerResponse.status || 502 }
      );
    }

    const response = NextResponse.json({
      success: true,
      userId: payload.data.userId,
      track: payload.data.track || track,
    });
    response.cookies.set(
      WORKER_SESSION_COOKIE,
      payload.data.token,
      workerSessionCookieOptions(process.env.NODE_ENV === "production")
    );
    return response;
  } catch (error: unknown) {
    console.error("[register] worker request failed");
    const message = error instanceof Error ? error.message : "Unable to register";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
