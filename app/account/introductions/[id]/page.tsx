import { notFound, redirect } from "next/navigation";
import { AccountShell } from "@/components/account/AccountShell";
import { FeedbackForm } from "@/components/account/FeedbackForm";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata = { robots: { index: false, follow: false } };

export default async function AccountIntroductionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const introduction = await prisma.introduction.findUnique({
    where: { id: params.id },
    include: { feedback: true },
  });

  if (
    !introduction ||
    (introduction.userAId !== user.id && introduction.userBId !== user.id)
  ) {
    notFound();
  }

  const ownFeedback = introduction.feedback.find((item) => item.userId === user.id);

  return (
    <AccountShell title="Introduction">
      <p className="text-[11px] uppercase tracking-[0.16em] text-gold">
        {introduction.status.replaceAll("_", " ")}
      </p>
      {introduction.scheduledAt ? (
        <p className="mt-4 text-ivory">{introduction.scheduledAt.toUTCString()}</p>
      ) : null}
      {introduction.location ? (
        <p className="mt-2 text-sm text-ivory/70">{introduction.location}</p>
      ) : null}
      {introduction.format ? (
        <p className="mt-2 text-sm text-ivory/70">{introduction.format}</p>
      ) : null}
      {introduction.instructions ? (
        <p className="mt-4 text-sm font-light text-ivory-muted">{introduction.instructions}</p>
      ) : null}
      {introduction.status === "COMPLETED" && !ownFeedback ? (
        <FeedbackForm introductionId={introduction.id} />
      ) : ownFeedback ? (
        <p className="mt-8 text-sm text-gold">Your private feedback has been recorded.</p>
      ) : null}
    </AccountShell>
  );
}
