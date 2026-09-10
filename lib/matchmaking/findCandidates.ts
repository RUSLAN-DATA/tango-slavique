import { ApplicationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  calculateCompatibility,
  type CompatibilityPerson,
} from "@/lib/matchmaking/calculateCompatibility";

function toPerson(input: {
  id: string;
  applyTrack: "WOMAN" | "MAN" | null;
  profile: {
    dateOfBirth: Date | null;
    city: string | null;
    country: string | null;
    heightCm: number | null;
    bodyType: string | null;
    education: string | null;
    religion: string | null;
    smoking: string | null;
    alcohol: string | null;
    children: string | null;
    wantsChildren: string | null;
    lifeGoals: string | null;
    relationshipExperience: string | null;
    languages: string | null;
  } | null;
  application: {
    quizGoal: string | null;
    quizGeography: string | null;
    dateOfBirth: Date | null;
    city: string;
    country: string;
    heightCm: number | null;
    bodyType: string | null;
    education: string | null;
    religion: string | null;
    smoking: string | null;
    alcohol: string | null;
    children: string | null;
    wantsChildren: string | null;
    lifeGoals: string | null;
    relationshipExperience: string | null;
    languages: string | null;
  } | null;
  partnerPreferences: {
    preferredAgeMin: number | null;
    preferredAgeMax: number | null;
    preferredHeightMin: number | null;
    preferredHeightMax: number | null;
    preferredBodyType: string | null;
    minimumEducation: string | null;
    importantQualities: string | null;
    dealBreakers: string | null;
  } | null;
}): CompatibilityPerson {
  const profile = input.profile;
  const application = input.application;
  const prefs = input.partnerPreferences;

  return {
    id: input.id,
    applyTrack: input.applyTrack,
    dateOfBirth: profile?.dateOfBirth ?? application?.dateOfBirth ?? null,
    city: profile?.city ?? application?.city ?? null,
    country: profile?.country ?? application?.country ?? null,
    heightCm: profile?.heightCm ?? application?.heightCm ?? null,
    bodyType: profile?.bodyType ?? application?.bodyType ?? null,
    education: profile?.education ?? application?.education ?? null,
    religion: profile?.religion ?? application?.religion ?? null,
    smoking: profile?.smoking ?? application?.smoking ?? null,
    alcohol: profile?.alcohol ?? application?.alcohol ?? null,
    children: profile?.children ?? application?.children ?? null,
    wantsChildren: profile?.wantsChildren ?? application?.wantsChildren ?? null,
    lifeGoals: profile?.lifeGoals ?? application?.lifeGoals ?? null,
    relationshipExperience:
      profile?.relationshipExperience ?? application?.relationshipExperience ?? null,
    languages: profile?.languages ?? application?.languages ?? null,
    quizGoal: application?.quizGoal ?? null,
    quizGeography: application?.quizGeography ?? null,
    preferredAgeMin: prefs?.preferredAgeMin ?? null,
    preferredAgeMax: prefs?.preferredAgeMax ?? null,
    preferredHeightMin: prefs?.preferredHeightMin ?? null,
    preferredHeightMax: prefs?.preferredHeightMax ?? null,
    preferredBodyType: prefs?.preferredBodyType ?? null,
    minimumEducation: prefs?.minimumEducation ?? null,
    importantQualities: prefs?.importantQualities ?? null,
    dealBreakers: prefs?.dealBreakers ?? null,
  };
}

export async function findCandidates(memberId: string) {
  const member = await prisma.user.findUnique({
    where: { id: memberId },
    include: {
      profile: true,
      application: true,
      partnerPreferences: true,
    },
  });

  if (!member?.applyTrack || !member.profile?.isMember) {
    return [];
  }

  const opposite = member.applyTrack === "WOMAN" ? "MAN" : "WOMAN";
  const candidates = await prisma.user.findMany({
    where: {
      id: { not: memberId },
      applyTrack: opposite,
      role: "USER",
      profile: { isMember: true },
      application: { status: ApplicationStatus.APPROVED },
    },
    include: {
      profile: true,
      application: true,
      partnerPreferences: true,
    },
  });

  const source = toPerson(member);

  return candidates
    .map((candidate) => {
      const result = calculateCompatibility(source, toPerson(candidate));
      return {
        userId: candidate.id,
        publicCode: candidate.application?.publicCode ?? null,
        firstName: candidate.profile?.firstName ?? "",
        city: candidate.profile?.city ?? candidate.application?.city ?? "",
        ...result,
      };
    })
    .sort((left, right) => right.compatibilityScore - left.compatibilityScore);
}
