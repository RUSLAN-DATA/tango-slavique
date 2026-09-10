import { IntroductionStatus, MatchStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications/notificationService";

export async function scheduleIntroduction(input: {
  introductionId: string;
  scheduledAt: Date;
  location: string;
  format: string;
  instructions?: string;
  privateNotes?: string;
}) {
  const introduction = await prisma.introduction.update({
    where: { id: input.introductionId },
    data: {
      status: IntroductionStatus.SCHEDULED,
      scheduledAt: input.scheduledAt,
      location: input.location,
      format: input.format,
      instructions: input.instructions,
      privateNotes: input.privateNotes,
    },
  });

  await prisma.match.update({
    where: { id: introduction.matchId },
    data: { status: MatchStatus.INTRODUCED },
  });

  await Promise.all([
    notifyUser({
      userId: introduction.userAId,
      title: "Introduction scheduled",
      body: "The house has arranged your private introduction.",
      href: `/account/introductions/${introduction.id}`,
      emailEvent: "introduction_scheduled",
    }),
    notifyUser({
      userId: introduction.userBId,
      title: "Introduction scheduled",
      body: "The house has arranged your private introduction.",
      href: `/account/introductions/${introduction.id}`,
      emailEvent: "introduction_scheduled",
    }),
  ]);

  return introduction;
}

export async function setIntroductionStatus(
  introductionId: string,
  status: IntroductionStatus
) {
  const introduction = await prisma.introduction.update({
    where: { id: introductionId },
    data: { status },
  });

  if (status === IntroductionStatus.COMPLETED) {
    await Promise.all([
      notifyUser({
        userId: introduction.userAId,
        title: "Private feedback requested",
        body: "Please share confidential feedback on your introduction.",
        href: `/account/introductions/${introduction.id}`,
        emailEvent: "feedback_request",
      }),
      notifyUser({
        userId: introduction.userBId,
        title: "Private feedback requested",
        body: "Please share confidential feedback on your introduction.",
        href: `/account/introductions/${introduction.id}`,
        emailEvent: "feedback_request",
      }),
    ]);
  }

  if (status === IntroductionStatus.CANCELLED) {
    await prisma.match.update({
      where: { id: introduction.matchId },
      data: { status: MatchStatus.CLOSED },
    });
  }

  return introduction;
}
