import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import { createMatchProposal } from "@/lib/matchmaking/createMatchProposal";

export async function POST(request: NextRequest) {
  try {
    const staff = await requireStaff();
    const body = (await request.json()) as { userAId?: string; userBId?: string };
    if (!body.userAId || !body.userBId) {
      return NextResponse.json({ error: "Two members are required" }, { status: 400 });
    }
    const match = await createMatchProposal({
      matchmakerId: staff.id,
      userAId: body.userAId,
      userBId: body.userBId,
    });
    return NextResponse.json({ success: true, id: match.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to propose";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
