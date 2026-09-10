import { redirect } from "next/navigation";
import Link from "next/link";
import { AccountShell } from "@/components/account/AccountShell";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { robots: { index: false, follow: false } };

export default async function AccountApplicationPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const application = user.application;
  const formHref = user.applyTrack === "MAN" ? "/apply/men/form" : "/apply/women/form";

  return (
    <AccountShell title="Application">
      {application ? (
        <div className="space-y-4 border border-white/[0.06] bg-white/[0.02] p-6">
          <p className="text-[11px] uppercase tracking-[0.16em] text-gold">
            {application.publicCode}
          </p>
          <p className="font-display text-3xl text-ivory">
            {application.status.replaceAll("_", " ")}
          </p>
          {application.moreInfoRequest ? (
            <p className="text-sm font-light text-amber-100/80">{application.moreInfoRequest}</p>
          ) : null}
          {application.status === "DRAFT" || application.status === "NEEDS_MORE_INFO" ? (
            <Link href={formHref} className="inline-block text-[11px] uppercase tracking-[0.18em] text-gold">
              Continue form
            </Link>
          ) : null}
        </div>
      ) : (
        <Link href={formHref} className="text-[11px] uppercase tracking-[0.18em] text-gold">
          Begin application
        </Link>
      )}
    </AccountShell>
  );
}
