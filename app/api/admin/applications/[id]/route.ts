import { NextRequest, NextResponse } from "next/server";
import { ApplicationStatus } from "@prisma/client";
import { requireStaff } from "@/lib/auth/session";
import { setApplicationStatus } from "@/lib/applications/applicationService";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const staff = await requireStaff();
    const body = (await request.json()) as {
      status?: ApplicationStatus;
      moreInfoRequest?: string;
      note?: string;
    };
    if (!body.status) {
      return NextResponse.json({ error: "Missing status" }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: params.id },
    });
    if (!application) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await setApplicationStatus({
      applicationId: application.id,
      staffId: staff.id,
      status: body.status,
      moreInfoRequest: body.moreInfoRequest,
      note: body.note,
    });

    return NextResponse.json({ success: true, status: updated.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update";
    const status = message === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
