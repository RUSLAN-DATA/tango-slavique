import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ApplicationStatus, MatchStatus, IntroductionStatus } from "@prisma/client";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminPage() {
  try {
    await requireStaff();
  } catch {
    redirect("/login");
  }

  const [pending, moreInfo, members, matches, intros, payments] = await Promise.all([
    prisma.application.count({
      where: { status: { in: [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW] } },
    }),
    prisma.application.count({ where: { status: ApplicationStatus.NEEDS_MORE_INFO } }),
    prisma.profile.count({ where: { isMember: true } }),
    prisma.match.count({
      where: {
        status: {
          in: [
            MatchStatus.PROPOSED,
            MatchStatus.WAITING_FOR_USER_A,
            MatchStatus.WAITING_FOR_USER_B,
            MatchStatus.ACCEPTED,
          ],
        },
      },
    }),
    prisma.introduction.count({
      where: { status: { in: [IntroductionStatus.PENDING, IntroductionStatus.SCHEDULED] } },
    }),
    prisma.payment.count(),
  ]);

  const cards = [
    { href: "/admin/applications", label: "Pending applications", value: pending },
    { href: "/admin/applications", label: "Needs information", value: moreInfo },
    { href: "/admin/members", label: "Approved members", value: members },
    { href: "/admin/matches", label: "Active matches", value: matches },
    { href: "/admin/introductions", label: "Pending introductions", value: intros },
    { href: "/admin/payments", label: "Payments", value: payments },
  ];

  return (
    <AdminShell title="Overview">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="border border-white/[0.06] bg-white/[0.02] px-5 py-6"
          >
            <p className="text-[11px] uppercase tracking-[0.16em] text-gold">{card.label}</p>
            <p className="mt-3 font-display text-3xl text-ivory">{card.value}</p>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
