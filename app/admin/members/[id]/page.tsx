import { notFound, redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { MemberMatchTools } from "@/components/admin/MemberMatchTools";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminMemberDetailPage({
  params,
}: {
  params: { id: string };
}) {
  try {
    await requireStaff();
  } catch {
    redirect("/login");
  }

  const member = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      profile: true,
      application: { include: { photos: true } },
      notesAbout: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!member) {
    notFound();
  }

  return (
    <AdminShell title={`${member.profile?.firstName || ""} ${member.profile?.lastName || ""}`.trim()}>
      <p className="text-sm text-ivory/70">
        {member.email} · {member.applyTrack} · {member.application?.publicCode}
      </p>
      <p className="mt-4 whitespace-pre-wrap text-sm font-light text-ivory-muted">
        {member.profile?.aboutMe}
      </p>
      {member.application?.photos.length ? (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          {member.application.photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={photo.id} src={`/api/photos/${photo.id}`} alt="" className="h-48 w-full object-cover" />
          ))}
        </div>
      ) : null}
      <div className="mt-8 space-y-2">
        {member.notesAbout.map((note) => (
          <p key={note.id} className="text-sm text-ivory/60">
            {note.body}
          </p>
        ))}
      </div>
      <MemberMatchTools memberId={member.id} />
    </AdminShell>
  );
}
