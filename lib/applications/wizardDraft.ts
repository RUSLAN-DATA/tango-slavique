export type WizardTrack = "MAN" | "WOMAN";

export type WizardDraftInput = {
  currentStep?: number;
  track?: WizardTrack | string;
  language?: string;
  quizGoal?: string;
  quizGeography?: string;
  quizInterviewReady?: boolean;
  lookingFor?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  city?: string;
  country?: string;
  heightCm?: number | string | null;
  weightKg?: number | null;
  bodyType?: string;
  hairColor?: string;
  eyeColor?: string;
  nationality?: string;
  maritalStatus?: string;
  religion?: string;
  education?: string;
  profession?: string;
  annualIncome?: string;
  languages?: string;
  smoking?: string;
  alcohol?: string;
  children?: string;
  wantsChildren?: string;
  aboutMe?: string;
  hobbies?: string;
  lifeGoals?: string;
  relationshipExperience?: string;
  instagram?: string;
  telegramHandle?: string;
  howHeard?: string;
  preferredAgeMin?: number | null;
  preferredAgeMax?: number | null;
  preferredHeightMin?: number | null;
  preferredHeightMax?: number | null;
  preferredBodyType?: string;
  minimumEducation?: string;
  importantQualities?: string;
  dealBreakers?: string;
  intent?: string;
  privacyAccepted?: boolean;
  termsAccepted?: boolean;
};

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function finiteNumber(value: unknown): number | undefined {
  const parsed = numberOrNull(value);
  return parsed === null ? undefined : parsed;
}

function assignIfText(target: Record<string, unknown>, key: string, value: unknown) {
  if (typeof value !== "string") {
    return;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return;
  }
  target[key] = trimmed;
}

function genderFromTrack(track?: string) {
  if (track === "MAN") return "man";
  if (track === "WOMAN") return "woman";
  return "";
}

function trackFromGender(gender?: unknown): WizardTrack | "" {
  if (gender === "man") return "MAN";
  if (gender === "woman") return "WOMAN";
  return "";
}

function detailsOf(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  return {};
}

export function mapWizardToProfilePatch(input: WizardDraftInput): Record<string, unknown> {
  const details: Record<string, unknown> = {};
  const assignDetail = (key: string, value: unknown) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    details[key] = value;
  };

  assignDetail("weightKg", input.weightKg ?? undefined);
  assignDetail("bodyType", input.bodyType);
  assignDetail("hairColor", input.hairColor);
  assignDetail("eyeColor", input.eyeColor);
  assignDetail("nationality", input.nationality);
  assignDetail("religion", input.religion);
  assignDetail("annualIncome", input.annualIncome);
  assignDetail("smoking", input.smoking);
  assignDetail("alcohol", input.alcohol);
  assignDetail("wantsChildren", input.wantsChildren);
  assignDetail("lifeGoals", input.lifeGoals);
  assignDetail("relationshipExperience", input.relationshipExperience);
  assignDetail("instagram", input.instagram);
  assignDetail("telegramHandle", input.telegramHandle);
  assignDetail("howHeard", input.howHeard);
  assignDetail("quizGoal", input.quizGoal);
  assignDetail("quizGeography", input.quizGeography);
  if (typeof input.quizInterviewReady === "boolean") {
    details.quizInterviewReady = input.quizInterviewReady;
  }
  assignDetail("lookingFor", input.lookingFor);

  const heightCm =
    typeof input.heightCm === "number"
      ? input.heightCm
      : typeof input.heightCm === "string" && String(input.heightCm).trim()
        ? Number(input.heightCm)
        : input.heightCm;

  const patch: Record<string, unknown> = {};
  assignIfText(patch, "first_name", input.firstName);
  assignIfText(patch, "last_name", input.lastName);
  assignIfText(patch, "phone", input.phone);
  assignIfText(patch, "birth_date", input.dateOfBirth);
  assignIfText(patch, "city", input.city);
  assignIfText(patch, "country", input.country);
  if (input.track) {
    const gender = genderFromTrack(input.track);
    if (gender) patch.gender = gender;
  }
  const heightValue = finiteNumber(heightCm);
  if (heightValue !== undefined) patch.height = heightValue;
  assignIfText(patch, "marital_status", input.maritalStatus);
  assignIfText(patch, "education", input.education);
  assignIfText(patch, "occupation", input.profession);
  assignIfText(patch, "languages", input.languages);
  assignIfText(patch, "children", input.children);
  assignIfText(patch, "about", input.aboutMe);
  assignIfText(patch, "hobbies", input.hobbies);
  if (typeof input.currentStep === "number") patch.current_step = input.currentStep;
  if (input.privacyAccepted) patch.privacy_accepted = true;
  if (input.termsAccepted) patch.terms_accepted = true;
  if (Object.keys(details).length) patch.details = details;
  return patch;
}

export function mapWizardToPreferencesPatch(input: WizardDraftInput): Record<string, unknown> | null {
  const patch: Record<string, unknown> = {};
  const ageMin = finiteNumber(input.preferredAgeMin);
  const ageMax = finiteNumber(input.preferredAgeMax);
  if (ageMin !== undefined) patch.age_min = ageMin;
  if (ageMax !== undefined) patch.age_max = ageMax;
  assignIfText(patch, "gender", input.lookingFor);
  assignIfText(patch, "intent", input.intent || input.quizGoal);

  const details: Record<string, unknown> = {};
  const heightMin = finiteNumber(input.preferredHeightMin);
  const heightMax = finiteNumber(input.preferredHeightMax);
  if (heightMin !== undefined) details.preferredHeightMin = heightMin;
  if (heightMax !== undefined) details.preferredHeightMax = heightMax;
  assignIfText(details, "preferredBodyType", input.preferredBodyType);
  assignIfText(details, "minimumEducation", input.minimumEducation);
  assignIfText(details, "importantQualities", input.importantQualities);
  assignIfText(details, "dealBreakers", input.dealBreakers);
  if (Object.keys(details).length) patch.details = details;

  return Object.keys(patch).length ? patch : null;
}

export function wizardStatusFromProfile(status: unknown, infoRequested = false): string {
  if (infoRequested || status === "info_requested") return "NEEDS_MORE_INFO";
  if (status === "pending") return "SUBMITTED";
  if (status === "approved") return "APPROVED";
  if (status === "rejected") return "REJECTED";
  return "DRAFT";
}

export function reconstructWizardState(input: {
  me?: Record<string, unknown> | null;
  profile?: Record<string, unknown> | null;
  preferences?: Record<string, unknown> | null;
  photos?: Array<{ id?: string } | string>;
}): {
  application: Record<string, unknown>;
  preferences: Record<string, unknown>;
  email: string;
} {
  const profile = input.profile || {};
  const details = detailsOf(profile.details);
  const prefs = input.preferences || {};
  const prefDetails = detailsOf(prefs.details);
  const photos = (input.photos || []).map((photo) =>
    typeof photo === "string" ? { id: photo } : { id: String(photo.id || "") }
  );
  const track =
    trackFromGender(profile.gender) ||
    (details.track === "MAN" || details.track === "WOMAN" ? details.track : "");

  return {
    email: text(input.me?.email),
    application: {
      firstName: text(profile.first_name),
      lastName: text(profile.last_name),
      phone: text(input.me?.phone),
      dateOfBirth: text(profile.birth_date),
      city: text(profile.city),
      country: text(profile.country),
      quizGoal: text(details.quizGoal),
      quizGeography: text(details.quizGeography),
      quizInterviewReady: Boolean(details.quizInterviewReady),
      lookingFor: text(details.lookingFor || prefs.gender),
      heightCm: numberOrNull(profile.height),
      weightKg: numberOrNull(details.weightKg),
      bodyType: text(details.bodyType),
      hairColor: text(details.hairColor),
      eyeColor: text(details.eyeColor),
      nationality: text(details.nationality),
      maritalStatus: text(profile.marital_status),
      religion: text(details.religion),
      education: text(profile.education),
      profession: text(profile.occupation),
      annualIncome: text(details.annualIncome),
      languages: text(profile.languages),
      smoking: text(details.smoking),
      alcohol: text(details.alcohol),
      children: text(profile.children),
      wantsChildren: text(details.wantsChildren),
      aboutMe: text(profile.about),
      hobbies: text(profile.hobbies),
      lifeGoals: text(details.lifeGoals),
      relationshipExperience: text(details.relationshipExperience),
      instagram: text(details.instagram),
      telegramHandle: text(details.telegramHandle),
      howHeard: text(details.howHeard),
      privacyAcceptedAt: profile.privacy_accepted_at || null,
      termsAcceptedAt: profile.terms_accepted_at || null,
      currentStep: Number(profile.current_step) || 1,
      status: wizardStatusFromProfile(profile.status),
      photos,
      track,
      gender: text(profile.gender),
    },
    preferences: {
      preferredAgeMin: numberOrNull(prefs.age_min),
      preferredAgeMax: numberOrNull(prefs.age_max),
      preferredHeightMin: numberOrNull(prefDetails.preferredHeightMin),
      preferredHeightMax: numberOrNull(prefDetails.preferredHeightMax),
      preferredBodyType: text(prefDetails.preferredBodyType),
      minimumEducation: text(prefDetails.minimumEducation),
      importantQualities: text(prefDetails.importantQualities),
      dealBreakers: text(prefDetails.dealBreakers),
      lookingFor: text(prefs.gender),
      intent: text(prefs.intent),
    },
  };
}

export function photoRequiredFromWorker(error?: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "PHOTO_REQUIRED" || /at least one photo/i.test(error.message || "");
}

export function workerPatchSendsBearer(headers: Headers): boolean {
  return /^Bearer\s+\S+/i.test(headers.get("Authorization") || "");
}
