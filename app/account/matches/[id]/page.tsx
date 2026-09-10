import { notFound, redirect } from "next/navigation";
import { AccountShell } from "@/components/account/AccountShell";
import { MatchResponseButtons } from "@/components/account/MatchResponseButtons";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata = { robots: { index: false, follow: false } };

export default async function AccountMatchDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: { responses: true },
  });

  if (!match || (match.userAId !== user.id && match.userBId !== user.id)) {
    notFound();
  }

  const mine = match.responses.find((item) => item.userId === user.id);

  return (
    <AccountShell title="Private proposal">
      <p className="text-sm font-light text-ivory-muted">
        The house has proposed a confidential introduction. The other person&apos;s private
        file is never shown in full. Compatibility is reviewed internally.
      </p>
      <p className="mt-8 text-[11px] uppercase tracking-[0.16em] text-gold">
        {match.status.replaceAll("_", " ")}
      </p>
      <p className="mt-3 text-ivory">Your response: {mine?.value || "PENDING"}</p>
      <MatchResponseButtons matchId={match.id} current={mine?.value || "PENDING"} />
    </AccountShell>
  );
}
