import type { Env } from "../env";
import { parseDetails } from "../jsonDetails";
import { listPhotos, publicPhotoView, type PhotoRow } from "../photos/service";
import { getReviewForPhoto } from "../photos/review";
import type { ApplicationRow } from "./service";

function text(value: unknown): string | null {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function bool(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }
  if (value === 1 || value === "1" || value === "true") {
    return true;
  }
  if (value === 0 || value === "0" || value === "false") {
    return false;
  }
  return null;
}

function number(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function firstText(...values: unknown[]): string | null {
  for (const value of values) {
    const next = text(value);
    if (next) {
      return next;
    }
  }
  return null;
}

export type ApplicantProfileView = {
  basic: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    city: string | null;
    country: string | null;
    nationality: string | null;
  };
  appearance: {
    height: number | null;
    weight: number | null;
    bodyType: string | null;
    hairColor: string | null;
    eyeColor: string | null;
  };
  personal: {
    maritalStatus: string | null;
    religion: string | null;
    education: string | null;
    profession: string | null;
    annualIncome: string | null;
    languages: string | null;
  };
  lifestyle: {
    smoking: string | null;
    alcohol: string | null;
    children: string | null;
    wantsChildren: string | null;
  };
  about: {
    aboutMe: string | null;
    hobbies: string | null;
    lifeGoals: string | null;
    relationshipExperience: string | null;
  };
  partner: {
    lookingFor: string | null;
    ageMin: number | null;
    ageMax: number | null;
    heightMin: number | null;
    heightMax: number | null;
    bodyType: string | null;
    minimumEducation: string | null;
    importantQualities: string | null;
    dealBreakers: string | null;
    intent: string | null;
  };
  additional: {
    instagram: string | null;
    telegram: string | null;
    howHeard: string | null;
  };
  screening: {
    quizGoal: string | null;
    quizGeography: string | null;
    interviewReady: boolean | null;
  };
};

export type AdminPhotoView = ReturnType<typeof publicPhotoView> & {
  photo_status: string;
  url: string;
  review: {
    status: string;
    confidence: number | null;
    issues: unknown[];
    main_person_detected: boolean;
    face_visible: boolean;
    quality: string | null;
    recommended_primary: boolean;
    admin_override: string | null;
    has_annotation: boolean;
  } | null;
};

function emptyApplicant(application: ApplicationRow): ApplicantProfileView {
  return {
    basic: {
      firstName: text(application.name),
      lastName: null,
      email: text(application.email),
      phone: text(application.phone),
      dateOfBirth: null,
      gender: null,
      city: text(application.city),
      country: null,
      nationality: null,
    },
    appearance: {
      height: null,
      weight: null,
      bodyType: null,
      hairColor: null,
      eyeColor: null,
    },
    personal: {
      maritalStatus: null,
      religion: null,
      education: null,
      profession: null,
      annualIncome: null,
      languages: null,
    },
    lifestyle: {
      smoking: null,
      alcohol: null,
      children: null,
      wantsChildren: null,
    },
    about: {
      aboutMe: text(application.message),
      hobbies: null,
      lifeGoals: null,
      relationshipExperience: null,
    },
    partner: {
      lookingFor: null,
      ageMin: null,
      ageMax: null,
      heightMin: null,
      heightMax: null,
      bodyType: null,
      minimumEducation: null,
      importantQualities: null,
      dealBreakers: null,
      intent: null,
    },
    additional: {
      instagram: null,
      telegram: null,
      howHeard: null,
    },
    screening: {
      quizGoal: null,
      quizGeography: null,
      interviewReady: null,
    },
  };
}

function parseIssues(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function presentAdminPhoto(
  photo: PhotoRow,
  review: Record<string, unknown> | null | undefined
): AdminPhotoView {
  return {
    ...publicPhotoView(photo),
    photo_status: photo.status,
    url: `/api/photos/${photo.id}`,
    review: review
      ? {
          status: String(review.review_status || review.status || ""),
          confidence: number(review.confidence),
          issues: parseIssues(review.issues),
          main_person_detected: Boolean(review.main_person_detected),
          face_visible: Boolean(review.face_visible),
          quality: text(review.quality),
          recommended_primary: Boolean(review.recommended_primary),
          admin_override: text(review.admin_override),
          has_annotation: Boolean(review.annotation_key),
        }
      : null,
  };
}

export function applicantFromRecords(input: {
  application: ApplicationRow;
  user?: Record<string, unknown> | null;
  profile?: Record<string, unknown> | null;
  preferences?: Record<string, unknown> | null;
}): ApplicantProfileView {
  const applicant = emptyApplicant(input.application);
  const profile = input.profile || {};
  const details = parseDetails(profile.details);
  const prefs = input.preferences || {};
  const prefDetails = parseDetails(prefs.details);
  const user = input.user || {};

  applicant.basic = {
    firstName: firstText(profile.first_name, input.application.name),
    lastName: text(profile.last_name),
    email: firstText(user.email, input.application.email),
    phone: firstText(user.phone, profile.phone, input.application.phone),
    dateOfBirth: text(profile.birth_date),
    gender: text(profile.gender),
    city: firstText(profile.city, input.application.city),
    country: text(profile.country),
    nationality: firstText(details.nationality, profile.nationality),
  };
  applicant.appearance = {
    height: number(profile.height),
    weight: number(details.weightKg ?? details.weight),
    bodyType: firstText(details.bodyType, profile.body_type),
    hairColor: firstText(details.hairColor, profile.hair_color),
    eyeColor: firstText(details.eyeColor, profile.eye_color),
  };
  applicant.personal = {
    maritalStatus: text(profile.marital_status),
    religion: firstText(details.religion, profile.religion),
    education: text(profile.education),
    profession: firstText(profile.occupation, details.profession),
    annualIncome: firstText(details.annualIncome, profile.annual_income),
    languages: text(profile.languages),
  };
  applicant.lifestyle = {
    smoking: firstText(details.smoking, profile.smoking),
    alcohol: firstText(details.alcohol, profile.alcohol),
    children: text(profile.children),
    wantsChildren: firstText(details.wantsChildren, profile.wants_children),
  };
  applicant.about = {
    aboutMe: firstText(profile.about, input.application.message),
    hobbies: text(profile.hobbies),
    lifeGoals: firstText(details.lifeGoals, details.goals),
    relationshipExperience: firstText(details.relationshipExperience, details.experience),
  };
  applicant.partner = {
    lookingFor: firstText(details.lookingFor, prefs.gender),
    ageMin: number(prefs.age_min),
    ageMax: number(prefs.age_max),
    heightMin: number(prefDetails.preferredHeightMin ?? prefDetails.heightMin),
    heightMax: number(prefDetails.preferredHeightMax ?? prefDetails.heightMax),
    bodyType: firstText(prefDetails.preferredBodyType, prefDetails.bodyType),
    minimumEducation: firstText(prefDetails.minimumEducation, prefDetails.education),
    importantQualities: firstText(prefDetails.importantQualities, prefDetails.qualities),
    dealBreakers: firstText(prefDetails.dealBreakers),
    intent: text(prefs.intent),
  };
  applicant.additional = {
    instagram: firstText(details.instagram, profile.instagram),
    telegram: firstText(details.telegramHandle, details.telegram),
    howHeard: firstText(details.howHeard, details.heard),
  };
  applicant.screening = {
    quizGoal: firstText(details.quizGoal, details.goal),
    quizGeography: firstText(details.quizGeography, details.geography),
    interviewReady: bool(details.quizInterviewReady),
  };
  return applicant;
}

export async function assembleAdminApplication(env: Env, application: ApplicationRow) {
  if (!application.user_id) {
    return {
      ...application,
      applicant: emptyApplicant(application),
      photos: [] as AdminPhotoView[],
    };
  }

  const [user, profile, preferences, photos] = await Promise.all([
    env.DB.prepare("SELECT id, email, phone, telegram_user_id FROM users WHERE id = ?")
      .bind(application.user_id)
      .first<Record<string, unknown>>(),
    env.DB.prepare("SELECT * FROM profiles WHERE user_id = ?")
      .bind(application.user_id)
      .first<Record<string, unknown>>(),
    env.DB.prepare("SELECT * FROM partner_preferences WHERE user_id = ?")
      .bind(application.user_id)
      .first<Record<string, unknown>>(),
    listPhotos(env, application.user_id),
  ]);

  const photosWithReviews = await Promise.all(
    photos.map(async (photo) =>
      presentAdminPhoto(photo, (await getReviewForPhoto(env, photo.id)) as Record<string, unknown> | null)
    )
  );

  return {
    ...application,
    email: firstText(user?.email, application.email),
    phone: firstText(user?.phone, application.phone),
    applicant: applicantFromRecords({
      application,
      user,
      profile,
      preferences,
    }),
    photos: photosWithReviews,
  };
}
