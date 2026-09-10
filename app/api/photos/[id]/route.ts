import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { readPrivatePhoto } from "@/lib/storage/photos";
import { isStaff } from "@/lib/auth/permissions";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const photo = await prisma.applicationPhoto.findUnique({
    where: { id: params.id },
  });

  if (!photo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (photo.userId !== user.id && !isStaff(user.role)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const file = await readPrivatePhoto(photo.storageKey);
  return new NextResponse(file, {
    headers: {
      "Content-Type": photo.mimeType,
      "Cache-Control": "private, max-age=60",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
