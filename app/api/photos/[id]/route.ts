import { NextRequest, NextResponse } from "next/server";
import { readWorkerSessionToken, workerBaseUrl } from "@/lib/worker/bff";
import { bearerHeaders } from "@/lib/auth/workerSession";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = readWorkerSessionToken();
  if (!token) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const response = await fetch(`${workerBaseUrl()}/api/photos/${params.id}`, {
    headers: bearerHeaders(token),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: response.status === 403 ? "FORBIDDEN" : "Not found" },
      { status: response.status }
    );
  }

  const bytes = await response.arrayBuffer();
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "application/octet-stream",
      "Cache-Control": "private, max-age=60",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
