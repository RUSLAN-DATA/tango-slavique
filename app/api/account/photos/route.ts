import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isAllowedPhoto, savePrivatePhoto } from "@/lib/storage/photos";
import { getOrCreateApplication } from "@/lib/applications/applicationService";

export async function POST(request: NextRequest) {
  try {
    const user = await requireVerifiedUser();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!isAllowedPhoto(file.type, buffer.byteLength)) {
      return NextResponse.json({ error: "Invalid photograph" }, { status: 400 });
    }

    const application = await getOrCreateApplication(user);
    const storageKey = await savePrivatePhoto(buffer, file.type);
    const photo = await prisma.applicationPhoto.create({
      data: {
        userId: user.id,
        applicationId: application.id,
        storageKey,
        mimeType: file.type,
        byteSize: buffer.byteLength,
      },
    });

    return NextResponse.json({ success: true, id: photo.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    const status = message === "UNAUTHENTICATED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
