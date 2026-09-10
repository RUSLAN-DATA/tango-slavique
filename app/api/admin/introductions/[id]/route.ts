import { NextRequest, NextResponse } from "next/server";
import { IntroductionStatus } from "@prisma/client";
import { requireStaff } from "@/lib/auth/session";
import {
  scheduleIntroduction,
  setIntroductionStatus,
} from "@/lib/introductions/introductionService";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireStaff();
    const body = (await request.json()) as {
      action?: string;
      scheduledAt?: string;
      location?: string;
      format?: string;
      instructions?: string;
      privateNotes?: string;
      status?: IntroductionStatus;
    };

    if (body.action === "schedule") {
      const introduction = await scheduleIntroduction({
        introductionId: params.id,
        scheduledAt: new Date(body.scheduledAt || Date.now()),
        location: body.location || "",
        format: body.format || "in-person",
        instructions: body.instructions,
        privateNotes: body.privateNotes,
      });
      return NextResponse.json({ success: true, introduction });
    }

    if (body.status) {
      const introduction = await setIntroductionStatus(params.id, body.status);
      return NextResponse.json({ success: true, status: introduction.status });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Unable to update introduction" }, { status: 400 });
  }
}
