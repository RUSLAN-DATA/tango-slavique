import { notFound, redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminMatchDetailPage({
  params,
}: {
  params: { id: string };
}) {
  try {
    await requireStaff();
  } catch {
    redirect("/login");
  }

  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: {
      userA: { include: { profile: true } },
      userB: { include: { profile: true } },
      responses: true,
      introductions: true,
    },
  });

  if (!match) {
    notFound();
  }

  return (
    <AdminShell title="Match file">
      <p className="text-[11px] uppercase tracking-[0.16em] text-gold">{match.status}</p>
      <p className="mt-4 text-ivory">
        {match.userA.profile?.firstName} / {match.userB.profile?.firstName}
      </p>
      <p className="mt-2 text-sm text-ivory/70">Score {match.compatibilityScore}</p>
      <ul className="mt-6 space-y-2 text-sm text-ivory/70">
        {match.responses.map((response) => (
          <li key={response.id}>
            {response.userId === match.userAId ? "A" : "B"}: {response.value}
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
