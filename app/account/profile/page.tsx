import { redirect } from "next/navigation";
import { AccountShell } from "@/components/account/AccountShell";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata = { robots: { index: false, follow: false } };

export default async function AccountProfilePage() {
  const user = await getCurrentUser();
  if (!user?.profile) {
    redirect("/login");
  }

  const photos = await prisma.applicationPhoto.findMany({
    where: { userId: user.id },
  });
  const profile = user.profile;

  const rows = [
    ["Name", `${profile.firstName} ${profile.lastName}`.trim()],
    ["City", profile.city],
    ["Country", profile.country],
    ["Profession", profile.profession],
    ["Languages", profile.languages],
  ];

  return (
    <AccountShell title="Private profile">
      <p className="mb-8 max-w-xl text-sm font-light text-ivory-muted">
        This profile is visible only to you and authorised matchmakers. It is never indexed.
      </p>
      <dl className="space-y-4">
        {rows.map(([label, value]) => (
          <div key={label} className="border-b border-white/[0.06] pb-3">
            <dt className="text-[11px] uppercase tracking-[0.16em] text-ivory/40">{label}</dt>
            <dd className="mt-1 text-ivory">{value || "—"}</dd>
          </div>
        ))}
      </dl>
      {photos.length ? (
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
          {photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.id}
              src={`/api/photos/${photo.id}`}
              alt=""
              className="h-40 w-full object-cover"
            />
          ))}
        </div>
      ) : null}
    </AccountShell>
  );
}
