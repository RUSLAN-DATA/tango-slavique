import { NextRequest, NextResponse } from "next/server";

const WORKER_URL =
  process.env.WORKER_URL ||
  process.env.NEXT_PUBLIC_WORKER_URL ||
  "https://tango-slavique-api.4507208.workers.dev";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function firstValue(...values: unknown[]) {
  for (const value of values) {
    const text = asString(value);
    if (text) {
      return text;
    }
  }
  return "";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const name = firstValue(body.contact, body.name);
    const phone = firstValue(body.phone, body.whatsapp);
    const city = firstValue(body.city);
    const details = firstValue(
      body.details,
      [body.age, body.city, body.lookingFor, body.geography, body.interviewReady]
        .map((item) => asString(item))
        .filter(Boolean)
        .join(" · ")
    );
    const message = [
      firstValue(body.applicant, body.track),
      firstValue(body.purpose, body.goal),
      details,
    ]
      .filter(Boolean)
      .join(" · ");

    const workerResponse = await fetch(`${WORKER_URL}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email: firstValue(body.email),
        phone,
        city,
        message,
        source: firstValue(body.source) || "website",
        language: firstValue(body.language),
        applicant: firstValue(body.applicant, body.track),
        purpose: firstValue(body.purpose, body.goal),
      }),
    });

    const payload = (await workerResponse.json().catch(() => null)) as
      | { ok?: boolean; data?: { id?: string }; error?: { message?: string } }
      | null;

    if (!workerResponse.ok || !payload?.ok) {
      return NextResponse.json(
        {
          success: false,
          error: payload?.error?.message || "Application could not be saved",
        },
        { status: workerResponse.status || 502 }
      );
    }

    return NextResponse.json({
      success: true,
      id: payload.data?.id,
      notified: true,
    });
  } catch (error: unknown) {
    console.error("[Application Route Exception]");
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
