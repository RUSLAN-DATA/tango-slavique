import { NextRequest, NextResponse } from "next/server";
import { FeedbackInterest } from "@prisma/client";
import { requireVerifiedUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireVerifiedUser();
    const introduction = await prisma.introduction.findUnique({
      where: { id: params.id },
    });
    if (!introduction || (introduction.userAId !== user.id && introduction.userBId !== user.id)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const body = (await request.json()) as { interest?: string; comment?: string };
    const interest = body.interest as FeedbackInterest | undefined;
    if (!interest || !(interest in FeedbackInterest)) {
      return NextResponse.json({ error: "Invalid feedback" }, { status: 400 });
    }

    await prisma.feedback.upsert({
      where: {
        introductionId_userId: {
          introductionId: introduction.id,
          userId: user.id,
        },
      },
      update: {
        interest,
        comment: typeof body.comment === "string" ? body.comment.slice(0, 2000) : null,
      },
      create: {
        introductionId: introduction.id,
        userId: user.id,
        interest,
        comment: typeof body.comment === "string" ? body.comment.slice(0, 2000) : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to save feedback" }, { status: 400 });
  }
}
