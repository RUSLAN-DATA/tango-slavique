import { NextRequest, NextResponse } from "next/server";
import { submitPublicApplicationToWorker } from "@/lib/applications/submitToWorker";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(clientKey(req, "application"), 8, 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 }
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    const result = await submitPublicApplicationToWorker(body);
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
    console.error("[Application Route Exception]");
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
