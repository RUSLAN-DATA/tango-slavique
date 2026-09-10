import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminMatchesPage() {
  try {
    await requireStaff();
  } catch {
    redirect("/login");
  }

  const matches = await prisma.match.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      userA: { include: { profile: true } },
      userB: { include: { profile: true } },
      responses: true,
    },
  });

  return (
    <AdminShell title="Matches">
      <ul className="space-y-3">
        {matches.map((match) => (
          <li key={match.id} className="border border-white/[0.06] px-5 py-4">
            <Link href={`/admin/matches/${match.id}`}>
              <p className="text-gold text-[11px] uppercase tracking-[0.16em]">
                {match.status} · {match.compatibilityScore ?? "—"}
              </p>
              <p className="mt-2 text-ivory">
                {match.userA.profile?.firstName} · {match.userB.profile?.firstName}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
