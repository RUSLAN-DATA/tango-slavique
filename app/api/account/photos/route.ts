import { NextRequest, NextResponse } from "next/server";
import { readWorkerSessionToken, workerBaseUrl } from "@/lib/worker/bff";
import { bearerHeaders } from "@/lib/auth/workerSession";

export async function POST(request: NextRequest) {
  const token = readWorkerSessionToken();
  if (!token) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const body = new FormData();
    body.set("file", file);
    const response = await fetch(`${workerBaseUrl()}/api/photos`, {
      method: "POST",
      headers: bearerHeaders(token),
      body,
    });
    const payload = (await response.json().catch(() => null)) as {
      ok?: boolean;
      data?: { id?: string };
      error?: { message?: string };
    } | null;

    if (!response.ok || !payload?.ok || !payload.data?.id) {
      return NextResponse.json(
        { error: payload?.error?.message || "Upload failed" },
        { status: response.status || 400 }
      );
    }

    return NextResponse.json({ success: true, id: payload.data.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
