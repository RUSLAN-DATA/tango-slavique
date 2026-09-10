import { NextRequest, NextResponse } from "next/server";
import { ApplicationStatus } from "@prisma/client";
import { requireVerifiedUser } from "@/lib/auth/session";
import {
  getOrCreateApplication,
  saveApplicationDraft,
  submitApplication,
} from "@/lib/applications/applicationService";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import {
  applicationDraftSchema,
  applicationSubmitSchema,
} from "@/lib/validation/application";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireVerifiedUser();
    const application = await getOrCreateApplication(user);
    const preferences = await prisma.partnerPreferences.findUnique({
      where: { userId: user.id },
    });
    return NextResponse.json({ application, preferences, email: user.email });
  } catch (error) {
    if (error instanceof Error && error.message === "UNVERIFIED") {
      return NextResponse.json({ error: "UNVERIFIED" }, { status: 403 });
    }
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireVerifiedUser();
    const parsed = applicationDraftSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const application = await saveApplicationDraft(user.id, parsed.data);
    return NextResponse.json({ success: true, application });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "UNVERIFIED" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(clientKey(request, "submit-app"), 8, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  try {
    const user = await requireVerifiedUser();
    const parsed = applicationSubmitSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const existing = await prisma.application.findUnique({
      where: { userId: user.id },
      include: { photos: true },
    });
    if (!existing?.photos.length) {
      return NextResponse.json({ error: "PHOTO_REQUIRED" }, { status: 400 });
    }

    if (
      existing.status !== ApplicationStatus.DRAFT &&
      existing.status !== ApplicationStatus.NEEDS_MORE_INFO
    ) {
      return NextResponse.json({ error: "Already submitted" }, { status: 400 });
    }

    const application = await submitApplication(user.id, parsed.data);
    return NextResponse.json({ success: true, application });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "UNVERIFIED" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
