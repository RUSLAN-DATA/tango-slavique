import {
  IntroductionStatus,
  MatchResponseValue,
  MatchStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { notifyUser } from "@/lib/notifications/notificationService";

export function nextMatchStatus(
  userAId: string,
  userBId: string,
  responses: { userId: string; value: MatchResponseValue }[]
) {
  const a = responses.find((item) => item.userId === userAId)?.value ?? MatchResponseValue.PENDING;
  const b = responses.find((item) => item.userId === userBId)?.value ?? MatchResponseValue.PENDING;

  if (a === MatchResponseValue.DECLINED || b === MatchResponseValue.DECLINED) {
    return MatchStatus.DECLINED;
  }

  if (a === MatchResponseValue.ACCEPTED && b === MatchResponseValue.ACCEPTED) {
    return MatchStatus.ACCEPTED;
  }

  if (a === MatchResponseValue.ACCEPTED && b === MatchResponseValue.PENDING) {
    return MatchStatus.WAITING_FOR_USER_B;
  }

  if (b === MatchResponseValue.ACCEPTED && a === MatchResponseValue.PENDING) {
    return MatchStatus.WAITING_FOR_USER_A;
  }

  return MatchStatus.PROPOSED;
}

export async function respondToMatch(input: {
  matchId: string;
  userId: string;
  value: "ACCEPTED" | "DECLINED";
}) {
  const match = await prisma.match.findUnique({
    where: { id: input.matchId },
    include: { responses: true },
  });

  if (!match) {
    throw new Error("Match not found");
  }

  if (match.userAId !== input.userId && match.userBId !== input.userId) {
    throw new Error("FORBIDDEN");
  }

  if (
    match.status === MatchStatus.DECLINED ||
    match.status === MatchStatus.CLOSED ||
    match.status === MatchStatus.EXPIRED
  ) {
    throw new Error("This proposal is no longer active");
  }

  await prisma.matchResponse.update({
    where: {
      matchId_userId: { matchId: input.matchId, userId: input.userId },
    },
    data: {
      value: input.value,
      respondedAt: new Date(),
    },
  });

  const refreshed = await prisma.match.findUniqueOrThrow({
    where: { id: input.matchId },
    include: { responses: true },
  });

  const status = nextMatchStatus(match.userAId, match.userBId, refreshed.responses);

  await prisma.match.update({
    where: { id: match.id },
    data: { status },
  });

  if (status === MatchStatus.ACCEPTED) {
    const introduction = await prisma.introduction.create({
      data: {
        matchId: match.id,
        userAId: match.userAId,
        userBId: match.userBId,
        status: IntroductionStatus.PENDING,
      },
    });

    await Promise.all([
      notifyUser({
        userId: match.userAId,
        title: "Mutual consent",
        body: "Both of you have accepted. The house will arrange a private introduction.",
        href: `/account/introductions/${introduction.id}`,
        emailEvent: "match_accepted",
      }),
      notifyUser({
        userId: match.userBId,
        title: "Mutual consent",
        body: "Both of you have accepted. The house will arrange a private introduction.",
        href: `/account/introductions/${introduction.id}`,
        emailEvent: "match_accepted",
      }),
    ]);
  }

  return prisma.match.findUniqueOrThrow({
    where: { id: match.id },
    include: { responses: true, introductions: true },
  });
}
