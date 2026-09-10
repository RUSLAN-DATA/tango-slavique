import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const staff = await requireStaff();
    const body = (await request.json()) as { body?: string };
    if (!body.body?.trim()) {
      return NextResponse.json({ error: "Note required" }, { status: 400 });
    }

    const note = await prisma.adminNote.create({
      data: {
        subjectUserId: params.id,
        authorId: staff.id,
        body: body.body.trim().slice(0, 4000),
      },
    });

    return NextResponse.json({ success: true, id: note.id });
  } catch {
    return NextResponse.json({ error: "Unable to save note" }, { status: 400 });
  }
}
