import { redirect } from "next/navigation";
import Link from "next/link";
import { AccountShell } from "@/components/account/AccountShell";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata = { robots: { index: false, follow: false } };

export default async function AccountMatchesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const matches = await prisma.match.findMany({
    where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
    include: { responses: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AccountShell title="Private proposals">
      {matches.length === 0 ? (
        <p className="text-sm font-light text-ivory-muted">
          The house has not yet proposed an introduction.
        </p>
      ) : (
        <ul className="space-y-4">
          {matches.map((match) => {
            const mine = match.responses.find((item) => item.userId === user.id);
            return (
              <li key={match.id} className="border border-white/[0.06] bg-white/[0.02] px-5 py-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-gold">
                  {match.status.replaceAll("_", " ")}
                </p>
                <p className="mt-2 text-sm text-ivory/70">
                  Your response: {mine?.value || "PENDING"}
                </p>
                <Link
                  href={`/account/matches/${match.id}`}
                  className="mt-3 inline-block text-[11px] uppercase tracking-[0.16em] text-gold"
                >
                  Open
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AccountShell>
  );
}
