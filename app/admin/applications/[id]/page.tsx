import { notFound, redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ApplicationReviewActions } from "@/components/admin/ApplicationReviewActions";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  try {
    await requireStaff();
  } catch {
    redirect("/login");
  }

  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: {
      user: { include: { partnerPreferences: true } },
      photos: true,
      notes: { include: { author: { include: { profile: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!application) {
    notFound();
  }

  const prefs = application.user.partnerPreferences;
  const sections = [
    ["Code", application.publicCode],
    ["Status", application.status],
    ["Track", application.track],
    ["Name", `${application.firstName} ${application.lastName}`],
    ["Phone", application.phone],
    ["City", application.city],
    ["Country", application.country],
    ["Height", application.heightCm],
    ["Weight", application.weightKg],
    ["Body type", application.bodyType],
    ["Hair", application.hairColor],
    ["Eyes", application.eyeColor],
    ["Nationality", application.nationality],
    ["Marital status", application.maritalStatus],
    ["Religion", application.religion],
    ["Education", application.education],
    ["Profession", application.profession],
    ["Income", application.annualIncome],
    ["Languages", application.languages],
    ["Smoking", application.smoking],
    ["Alcohol", application.alcohol],
    ["Children", application.children],
    ["Wants children", application.wantsChildren],
    ["About", application.aboutMe],
    ["Hobbies", application.hobbies],
    ["Life goals", application.lifeGoals],
    ["Relationship experience", application.relationshipExperience],
    ["Age preference", `${prefs?.preferredAgeMin ?? "—"}–${prefs?.preferredAgeMax ?? "—"}`],
    ["Qualities", prefs?.importantQualities],
    ["Deal breakers", prefs?.dealBreakers],
  ];

  return (
    <AdminShell title={application.publicCode}>
      <dl className="grid gap-4 md:grid-cols-2">
        {sections.map(([label, value]) => (
          <div key={String(label)} className="border-b border-white/[0.06] pb-3">
            <dt className="text-[11px] uppercase tracking-[0.16em] text-ivory/40">{label}</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-ivory">{String(value || "—")}</dd>
          </div>
        ))}
      </dl>
      {application.photos.length ? (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          {application.photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={photo.id} src={`/api/photos/${photo.id}`} alt="" className="h-48 w-full object-cover" />
          ))}
        </div>
      ) : null}
      <div className="mt-10 space-y-3">
        {application.notes.map((note) => (
          <p key={note.id} className="text-sm text-ivory/70">
            {note.createdAt.toUTCString()} — {note.body}
          </p>
        ))}
      </div>
      <ApplicationReviewActions applicationId={application.id} />
    </AdminShell>
  );
}
