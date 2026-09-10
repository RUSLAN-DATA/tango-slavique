import { NextRequest, NextResponse } from "next/server";
import { MatchResponseValue } from "@prisma/client";
import { requireVerifiedUser } from "@/lib/auth/session";
import { respondToMatch } from "@/lib/matchmaking/respondToMatch";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireVerifiedUser();
    const body = (await request.json()) as { value?: string };
    const value =
      body.value === "DECLINED"
        ? MatchResponseValue.DECLINED
        : MatchResponseValue.ACCEPTED;
    const match = await respondToMatch({
      matchId: params.id,
      userId: user.id,
      value,
    });
    return NextResponse.json({ success: true, status: match.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to respond";
    const status = message === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
