import { redirect } from "next/navigation";
import Link from "next/link";
import { AccountShell } from "@/components/account/AccountShell";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata = { robots: { index: false, follow: false } };

export default async function AccountIntroductionsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const introductions = await prisma.introduction.findMany({
    where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AccountShell title="Introductions">
      {introductions.length === 0 ? (
        <p className="text-sm font-light text-ivory-muted">No introductions have been arranged.</p>
      ) : (
        <ul className="space-y-4">
          {introductions.map((item) => (
            <li key={item.id} className="border border-white/[0.06] px-5 py-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-gold">
                {item.status.replaceAll("_", " ")}
              </p>
              <p className="mt-2 text-sm text-ivory/70">
                {item.scheduledAt ? item.scheduledAt.toUTCString() : "Awaiting arrangement"}
              </p>
              <Link
                href={`/account/introductions/${item.id}`}
                className="mt-3 inline-block text-[11px] uppercase tracking-[0.16em] text-gold"
              >
                Open
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AccountShell>
  );
}
