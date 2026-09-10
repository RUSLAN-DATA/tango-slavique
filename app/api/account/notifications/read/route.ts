import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { markRead } from "@/lib/notifications/notificationService";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = (await request.json().catch(() => ({}))) as { id?: string };
    await markRead(user.id, body.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }
}
