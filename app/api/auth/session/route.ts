import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { unreadCount } from "@/lib/notifications/notificationService";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      applyTrack: user.applyTrack,
      emailVerified: Boolean(user.emailVerifiedAt),
      firstName: user.profile?.firstName || "",
      unread: await unreadCount(user.id),
    },
  });
}
