import { redirect } from "next/navigation";
import Link from "next/link";
import { AccountShell } from "@/components/account/AccountShell";
import { getCurrentUser } from "@/lib/auth/session";
import { applicationCompleteness } from "@/lib/applications/applicationService";
import { unreadCount } from "@/lib/notifications/notificationService";
import { prisma } from "@/lib/db";

export const metadata = { robots: { index: false, follow: false } };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [unread, activeMatch] = await Promise.all([
    unreadCount(user.id),
    prisma.match.findFirst({
      where: {
        OR: [{ userAId: user.id }, { userBId: user.id }],
        status: { in: ["PROPOSED", "WAITING_FOR_USER_A", "WAITING_FOR_USER_B", "ACCEPTED"] },
      },
    }),
  ]);

  const completeness = user.application
    ? applicationCompleteness(user.application)
    : 0;
  const formHref = user.applyTrack === "MAN" ? "/apply/men/form" : "/apply/women/form";

  const cards = [
    {
      href: "/account/application",
      label: "Application",
      value: user.application?.status.replaceAll("_", " ") || "Draft",
    },
    {
      href: "/account/profile",
      label: "Profile",
      value: completeness >= 80 ? "Complete" : "In progress",
    },
    {
      href: "/account/matches",
      label: "Matchmaking",
      value: activeMatch ? "Active proposal" : "No active proposal",
    },
    {
      href: "/account/notifications",
      label: "Notifications",
      value: `${unread} unread`,
    },
  ];

  return (
    <AccountShell title={user.profile?.firstName || "Private account"}>
      {!user.emailVerifiedAt ? (
        <p className="mb-8 border border-amber-400/20 bg-gold/[0.06] px-4 py-3 text-sm text-amber-100">
          Please confirm your email to continue.{" "}
          <Link href="/verify-email" className="text-gold underline">
            Verify email
          </Link>
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="border border-white/[0.06] bg-white/[0.02] px-5 py-6 transition-colors hover:border-amber-400/30"
          >
            <p className="text-[11px] uppercase tracking-[0.16em] text-gold">{card.label}</p>
            <p className="mt-3 font-display text-2xl text-ivory">{card.value}</p>
          </Link>
        ))}
      </div>
      {user.application?.status === "DRAFT" || user.application?.status === "NEEDS_MORE_INFO" ? (
        <Link
          href={formHref}
          className="mt-10 inline-block bg-gold px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-obsidian"
        >
          Continue application
        </Link>
      ) : null}
    </AccountShell>
  );
}
