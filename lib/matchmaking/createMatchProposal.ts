import { MatchResponseValue, MatchStatus } from "@prisma/client";
import { MATCH_PROPOSAL_DAYS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { calculateCompatibility } from "@/lib/matchmaking/calculateCompatibility";
import { findCandidates } from "@/lib/matchmaking/findCandidates";
import { notifyUser } from "@/lib/notifications/notificationService";

export async function createMatchProposal(input: {
  matchmakerId: string;
  userAId: string;
  userBId: string;
}) {
  if (input.userAId === input.userBId) {
    throw new Error("A match requires two different members");
  }

  const [userA, userB] = await Promise.all([
    prisma.user.findUnique({
      where: { id: input.userAId },
      include: { profile: true, application: true, partnerPreferences: true },
    }),
    prisma.user.findUnique({
      where: { id: input.userBId },
      include: { profile: true, application: true, partnerPreferences: true },
    }),
  ]);

  if (!userA?.profile?.isMember || !userB?.profile?.isMember) {
    throw new Error("Both people must be approved members");
  }

  const existing = await prisma.match.findFirst({
    where: {
      OR: [
        { userAId: input.userAId, userBId: input.userBId },
        { userAId: input.userBId, userBId: input.userAId },
      ],
      status: {
        in: [
          MatchStatus.PROPOSED,
          MatchStatus.WAITING_FOR_USER_A,
          MatchStatus.WAITING_FOR_USER_B,
          MatchStatus.ACCEPTED,
          MatchStatus.INTRODUCED,
        ],
      },
    },
  });

  if (existing) {
    throw new Error("An active proposal already exists for these members");
  }

  const ranked = await findCandidates(input.userAId);
  const scored = ranked.find((item) => item.userId === input.userBId);
  const fallback = calculateCompatibility(
    {
      id: userA.id,
      applyTrack: userA.applyTrack,
      dateOfBirth: userA.profile.dateOfBirth,
      city: userA.profile.city,
      country: userA.profile.country,
      heightCm: userA.profile.heightCm,
      bodyType: userA.profile.bodyType,
      education: userA.profile.education,
      religion: userA.profile.religion,
      smoking: userA.profile.smoking,
      alcohol: userA.profile.alcohol,
      children: userA.profile.children,
      wantsChildren: userA.profile.wantsChildren,
      lifeGoals: userA.profile.lifeGoals,
      relationshipExperience: userA.profile.relationshipExperience,
      languages: userA.profile.languages,
      quizGoal: userA.application?.quizGoal ?? null,
      quizGeography: userA.application?.quizGeography ?? null,
      preferredAgeMin: userA.partnerPreferences?.preferredAgeMin ?? null,
      preferredAgeMax: userA.partnerPreferences?.preferredAgeMax ?? null,
      preferredHeightMin: userA.partnerPreferences?.preferredHeightMin ?? null,
      preferredHeightMax: userA.partnerPreferences?.preferredHeightMax ?? null,
      preferredBodyType: userA.partnerPreferences?.preferredBodyType ?? null,
      minimumEducation: userA.partnerPreferences?.minimumEducation ?? null,
      importantQualities: userA.partnerPreferences?.importantQualities ?? null,
      dealBreakers: userA.partnerPreferences?.dealBreakers ?? null,
    },
    {
      id: userB.id,
      applyTrack: userB.applyTrack,
      dateOfBirth: userB.profile.dateOfBirth,
      city: userB.profile.city,
      country: userB.profile.country,
      heightCm: userB.profile.heightCm,
      bodyType: userB.profile.bodyType,
      education: userB.profile.education,
      religion: userB.profile.religion,
      smoking: userB.profile.smoking,
      alcohol: userB.profile.alcohol,
      children: userB.profile.children,
      wantsChildren: userB.profile.wantsChildren,
      lifeGoals: userB.profile.lifeGoals,
      relationshipExperience: userB.profile.relationshipExperience,
      languages: userB.profile.languages,
      quizGoal: userB.application?.quizGoal ?? null,
      quizGeography: userB.application?.quizGeography ?? null,
      preferredAgeMin: userB.partnerPreferences?.preferredAgeMin ?? null,
      preferredAgeMax: userB.partnerPreferences?.preferredAgeMax ?? null,
      preferredHeightMin: userB.partnerPreferences?.preferredHeightMin ?? null,
      preferredHeightMax: userB.partnerPreferences?.preferredHeightMax ?? null,
      preferredBodyType: userB.partnerPreferences?.preferredBodyType ?? null,
      minimumEducation: userB.partnerPreferences?.minimumEducation ?? null,
      importantQualities: userB.partnerPreferences?.importantQualities ?? null,
      dealBreakers: userB.partnerPreferences?.dealBreakers ?? null,
    }
  );

  const score = scored ?? { ...fallback, compatibilityScore: fallback.compatibilityScore };

  const match = await prisma.match.create({
    data: {
      userAId: input.userAId,
      userBId: input.userBId,
      createdById: input.matchmakerId,
      status: MatchStatus.PROPOSED,
      compatibilityScore: score.compatibilityScore,
      positiveFactors: score.positiveFactors,
      potentialConflicts: score.potentialConflicts,
      preferenceMatches: score.preferenceMatches,
      preferenceConflicts: score.preferenceConflicts,
      expiresAt: new Date(Date.now() + MATCH_PROPOSAL_DAYS * 24 * 60 * 60 * 1000),
      responses: {
        create: [
          { userId: input.userAId, value: MatchResponseValue.PENDING },
          { userId: input.userBId, value: MatchResponseValue.PENDING },
        ],
      },
    },
  });

  await Promise.all([
    notifyUser({
      userId: input.userAId,
      title: "A private matchmaking proposal",
      body: "The house has proposed a confidential introduction. Please respond in your account.",
      href: `/account/matches/${match.id}`,
      emailEvent: "match_proposal",
    }),
    notifyUser({
      userId: input.userBId,
      title: "A private matchmaking proposal",
      body: "The house has proposed a confidential introduction. Please respond in your account.",
      href: `/account/matches/${match.id}`,
      emailEvent: "match_proposal",
    }),
  ]);

  return match;
}
