import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminMembersPage() {
  try {
    await requireStaff();
  } catch {
    redirect("/login");
  }

  const members = await prisma.user.findMany({
    where: { profile: { isMember: true } },
    include: { profile: true, application: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminShell title="Members">
      <ul className="space-y-3">
        {members.map((member) => (
          <li key={member.id} className="border border-white/[0.06] px-5 py-4">
            <Link href={`/admin/members/${member.id}`}>
              <p className="text-ivory">
                {member.profile?.firstName} {member.profile?.lastName}
              </p>
              <p className="mt-1 text-sm text-ivory/50">
                {member.applyTrack} · {member.application?.publicCode}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
