import {
  ApplicationStatus,
  ApplyTrack,
  type Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { publicApplicationCode } from "@/lib/auth/tokens";
import { notifyUser } from "@/lib/notifications/notificationService";
import type { ApplicationDraftInput } from "@/lib/validation/application";

function emptyToNull(value?: string | null) {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function parseDate(value?: string | null) {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function getOrCreateApplication(user: {
  id: string;
  applyTrack: ApplyTrack | null;
  email: string;
}) {
  const existing = await prisma.application.findUnique({
    where: { userId: user.id },
    include: { photos: true },
  });

  if (existing) {
    return existing;
  }

  const track = user.applyTrack ?? ApplyTrack.WOMAN;

  const [application] = await prisma.$transaction([
    prisma.application.create({
      data: {
        userId: user.id,
        track,
        publicCode: publicApplicationCode(),
      },
      include: { photos: true },
    }),
    prisma.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    }),
    prisma.partnerPreferences.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    }),
  ]);

  return application;
}

export function mapDraft(input: ApplicationDraftInput) {
  const dateOfBirth = parseDate(input.dateOfBirth);
  const application: Prisma.ApplicationUpdateInput = {
    currentStep: input.currentStep,
    language: input.language,
    quizGoal: emptyToNull(input.quizGoal),
    quizGeography: emptyToNull(input.quizGeography),
    quizInterviewReady: input.quizInterviewReady,
    lookingFor: emptyToNull(input.lookingFor),
    firstName: input.firstName ?? undefined,
    lastName: input.lastName ?? undefined,
    phone: input.phone ?? undefined,
    dateOfBirth,
    city: input.city ?? undefined,
    country: input.country ?? undefined,
    heightCm: input.heightCm ?? undefined,
    weightKg: input.weightKg ?? undefined,
    bodyType: emptyToNull(input.bodyType),
    hairColor: emptyToNull(input.hairColor),
    eyeColor: emptyToNull(input.eyeColor),
    nationality: emptyToNull(input.nationality),
    maritalStatus: emptyToNull(input.maritalStatus),
    religion: emptyToNull(input.religion),
    education: emptyToNull(input.education),
    profession: emptyToNull(input.profession),
    annualIncome: emptyToNull(input.annualIncome),
    languages: emptyToNull(input.languages),
    smoking: emptyToNull(input.smoking),
    alcohol: emptyToNull(input.alcohol),
    children: emptyToNull(input.children),
    wantsChildren: emptyToNull(input.wantsChildren),
    aboutMe: emptyToNull(input.aboutMe),
    hobbies: emptyToNull(input.hobbies),
    lifeGoals: emptyToNull(input.lifeGoals),
    relationshipExperience: emptyToNull(input.relationshipExperience),
    instagram: emptyToNull(input.instagram),
    telegramHandle: emptyToNull(input.telegramHandle),
    howHeard: emptyToNull(input.howHeard),
  };

  if (input.track) {
    application.track = input.track;
  }

  if (input.privacyAccepted) {
    application.privacyAcceptedAt = new Date();
  }
  if (input.termsAccepted) {
    application.termsAcceptedAt = new Date();
  }

  const preferences: Prisma.PartnerPreferencesUpdateInput = {
    preferredAgeMin: input.preferredAgeMin ?? undefined,
    preferredAgeMax: input.preferredAgeMax ?? undefined,
    preferredHeightMin: input.preferredHeightMin ?? undefined,
    preferredHeightMax: input.preferredHeightMax ?? undefined,
    preferredBodyType: emptyToNull(input.preferredBodyType),
    minimumEducation: emptyToNull(input.minimumEducation),
    importantQualities: emptyToNull(input.importantQualities),
    dealBreakers: emptyToNull(input.dealBreakers),
  };

  return { application, preferences, dateOfBirth };
}

export async function saveApplicationDraft(userId: string, input: ApplicationDraftInput) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const current = await getOrCreateApplication(user);

  if (
    current.status !== ApplicationStatus.DRAFT &&
    current.status !== ApplicationStatus.NEEDS_MORE_INFO
  ) {
    throw new Error("Application can no longer be edited");
  }

  const mapped = mapDraft(input);

  await prisma.$transaction([
    prisma.application.update({
      where: { id: current.id },
      data: mapped.application,
    }),
    prisma.partnerPreferences.update({
      where: { userId: userId },
      data: { ...mapped.preferences, applicationId: current.id },
    }),
    prisma.profile.update({
      where: { userId },
      data: {
        firstName: input.firstName || undefined,
        lastName: input.lastName || undefined,
        phone: emptyToNull(input.phone),
        dateOfBirth: mapped.dateOfBirth,
        city: emptyToNull(input.city),
        country: emptyToNull(input.country),
        heightCm: input.heightCm ?? undefined,
        weightKg: input.weightKg ?? undefined,
        bodyType: emptyToNull(input.bodyType),
        hairColor: emptyToNull(input.hairColor),
        eyeColor: emptyToNull(input.eyeColor),
        nationality: emptyToNull(input.nationality),
        maritalStatus: emptyToNull(input.maritalStatus),
        religion: emptyToNull(input.religion),
        education: emptyToNull(input.education),
        profession: emptyToNull(input.profession),
        annualIncome: emptyToNull(input.annualIncome),
        languages: emptyToNull(input.languages),
        smoking: emptyToNull(input.smoking),
        alcohol: emptyToNull(input.alcohol),
        children: emptyToNull(input.children),
        wantsChildren: emptyToNull(input.wantsChildren),
        aboutMe: emptyToNull(input.aboutMe),
        hobbies: emptyToNull(input.hobbies),
        lifeGoals: emptyToNull(input.lifeGoals),
        relationshipExperience: emptyToNull(input.relationshipExperience),
        instagram: emptyToNull(input.instagram),
        telegram: emptyToNull(input.telegramHandle),
        howHeard: emptyToNull(input.howHeard),
      },
    }),
  ]);

  return prisma.application.findUniqueOrThrow({
    where: { id: current.id },
    include: { photos: true },
  });
}

export async function submitApplication(userId: string, input: ApplicationDraftInput) {
  const saved = await saveApplicationDraft(userId, {
    ...input,
    currentStep: 7,
    privacyAccepted: true,
    termsAccepted: true,
  });

  const submitted = await prisma.application.update({
    where: { id: saved.id },
    data: {
      status: ApplicationStatus.SUBMITTED,
      submittedAt: new Date(),
    },
  });

  await notifyUser({
    userId,
    title: "Application received",
    body: `Your application ${submitted.publicCode} has been received.`,
    href: "/account/application",
    emailEvent: "application_submitted",
    emailData: { code: submitted.publicCode },
  });

  return submitted;
}

export async function setApplicationStatus(input: {
  applicationId: string;
  staffId: string;
  status: ApplicationStatus;
  moreInfoRequest?: string;
  note?: string;
}) {
  const application = await prisma.application.findUniqueOrThrow({
    where: { id: input.applicationId },
  });

  const updated = await prisma.application.update({
    where: { id: application.id },
    data: {
      status: input.status,
      reviewedAt: new Date(),
      moreInfoRequest:
        input.status === ApplicationStatus.NEEDS_MORE_INFO
          ? input.moreInfoRequest || application.moreInfoRequest
          : input.status === ApplicationStatus.SUBMITTED
            ? null
            : application.moreInfoRequest,
    },
  });

  if (input.note) {
    await prisma.adminNote.create({
      data: {
        subjectUserId: application.userId,
        authorId: input.staffId,
        applicationId: application.id,
        body: input.note,
      },
    });
  }

  if (input.status === ApplicationStatus.APPROVED) {
    await prisma.profile.update({
      where: { userId: application.userId },
      data: { isMember: true, memberAt: new Date() },
    });
    await notifyUser({
      userId: application.userId,
      title: "Application approved",
      body: "You have been admitted as a private member.",
      href: "/account",
      emailEvent: "application_approved",
    });
  }

  if (input.status === ApplicationStatus.REJECTED) {
    await notifyUser({
      userId: application.userId,
      title: "Application decision",
      body: "The house is unable to proceed with membership at this time.",
      href: "/account/application",
      emailEvent: "application_rejected",
    });
  }

  if (input.status === ApplicationStatus.UNDER_REVIEW) {
    await notifyUser({
      userId: application.userId,
      title: "Application under review",
      body: "Your file is now being reviewed by the matchmaking team.",
      href: "/account/application",
      emailEvent: "application_under_review",
      emailData: { code: application.publicCode },
    });
  }

  if (input.status === ApplicationStatus.NEEDS_MORE_INFO) {
    await notifyUser({
      userId: application.userId,
      title: "Further information requested",
      body: input.moreInfoRequest || "Please complete additional details on your application.",
      href: "/account/application",
      emailEvent: "more_information_requested",
    });
  }

  return updated;
}

export function applicationCompleteness(application: {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  country: string;
  aboutMe: string | null;
  dateOfBirth: Date | null;
}) {
  const checks = [
    application.firstName,
    application.lastName,
    application.phone,
    application.city,
    application.country,
    application.aboutMe,
    application.dateOfBirth,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}
