import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";
import { SESSION_COOKIE } from "@/lib/constants";

export async function POST() {
  await destroySession();
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return response;
}
