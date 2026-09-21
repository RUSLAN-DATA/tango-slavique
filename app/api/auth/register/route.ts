import { NextRequest, NextResponse } from "next/server";
import { submitPublicApplicationToWorker } from "@/lib/applications/submitToWorker";
import { clientKey, rateLimit } from "@/lib/rate-limit";

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
    const result = await submitPublicApplicationToWorker({
      ...body,
      source:
        typeof body.source === "string" && body.source.trim()
          ? body.source
          : "website",
    });
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      id: result.id,
      status: result.status,
      notified: result.notified,
      reused: result.reused,
    });
  } catch (error: unknown) {
    console.error("[register] worker request failed");
    const message = error instanceof Error ? error.message : "Unable to register";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
