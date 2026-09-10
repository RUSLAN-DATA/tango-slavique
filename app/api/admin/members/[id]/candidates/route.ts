import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import { findCandidates } from "@/lib/matchmaking/findCandidates";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireStaff();
    const candidates = await findCandidates(params.id);
    return NextResponse.json({ candidates });
  } catch {
    return NextResponse.json({ error: "Unable to score candidates" }, { status: 400 });
  }
}
