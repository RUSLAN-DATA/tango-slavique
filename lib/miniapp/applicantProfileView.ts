export type ApplicantProfileView = {
  basic?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    dateOfBirth?: string | null;
    gender?: string | null;
    city?: string | null;
    country?: string | null;
    nationality?: string | null;
  };
  appearance?: {
    height?: number | string | null;
    weight?: number | string | null;
    bodyType?: string | null;
    hairColor?: string | null;
    eyeColor?: string | null;
  };
  personal?: {
    maritalStatus?: string | null;
    religion?: string | null;
    education?: string | null;
    profession?: string | null;
    annualIncome?: string | null;
    languages?: string | null;
  };
  lifestyle?: {
    smoking?: string | null;
    alcohol?: string | null;
    children?: string | null;
    wantsChildren?: string | null;
  };
  about?: {
    aboutMe?: string | null;
    hobbies?: string | null;
    lifeGoals?: string | null;
    relationshipExperience?: string | null;
  };
  partner?: {
    lookingFor?: string | null;
    ageMin?: number | string | null;
    ageMax?: number | string | null;
    heightMin?: number | string | null;
    heightMax?: number | string | null;
    bodyType?: string | null;
    minimumEducation?: string | null;
    importantQualities?: string | null;
    dealBreakers?: string | null;
    intent?: string | null;
  };
  additional?: {
    instagram?: string | null;
    telegram?: string | null;
    howHeard?: string | null;
  };
  screening?: {
    quizGoal?: string | null;
    quizGeography?: string | null;
    interviewReady?: boolean | null;
  };
};

export type ApplicantField = {
  key: string;
  value: string | number | boolean | null | undefined;
};

export type ApplicantSection = {
  id: "profile" | "appearance" | "personal" | "lifestyle" | "about" | "partner" | "additional" | "screening" | "application";
  fields: ApplicantField[];
};

export type ApplicationMeta = {
  status?: string | null;
  source?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

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

function firstText(...values: unknown[]): string | null {
  for (const value of values) {
    const next = text(value);
    if (next) {
      return next;
    }
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

export function displayApplicantValue(
  value: string | number | boolean | null | undefined | object,
  labels?: { yes: string; no: string; empty: string }
): string {
  const empty = labels?.empty ?? "—";
  if (value === null || value === undefined) {
    return empty;
  }
  if (typeof value === "boolean") {
    return value ? labels?.yes ?? "yes" : labels?.no ?? "no";
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "object") {
    return empty;
  }
  const textValue = String(value).trim();
  if (!textValue || textValue === "[object Object]" || textValue === "undefined" || textValue === "null") {
    return empty;
  }
  return textValue;
}

export function rangeApplicantValue(
  min: string | number | null | undefined,
  max: string | number | null | undefined,
  empty = "—"
): string {
  const a = min === null || min === undefined || min === "" ? "" : String(min);
  const b = max === null || max === undefined || max === "" ? "" : String(max);
  if (!a && !b) {
    return empty;
  }
  if (a && b) {
    return `${a}–${b}`;
  }
  return a || b;
}

export function applicantSections(applicant?: ApplicantProfileView | null): ApplicantSection[] {
  const profile = applicant || {};
  return [
    {
      id: "profile",
      fields: [
        { key: "firstName", value: profile.basic?.firstName },
        { key: "lastName", value: profile.basic?.lastName },
        { key: "gender", value: profile.basic?.gender },
        { key: "dateOfBirth", value: profile.basic?.dateOfBirth },
        { key: "city", value: profile.basic?.city },
        { key: "country", value: profile.basic?.country },
        { key: "nationality", value: profile.basic?.nationality },
        { key: "phone", value: profile.basic?.phone },
        { key: "email", value: profile.basic?.email },
      ],
    },
    {
      id: "appearance",
      fields: [
        { key: "height", value: profile.appearance?.height },
        { key: "weight", value: profile.appearance?.weight },
        { key: "bodyType", value: profile.appearance?.bodyType },
        { key: "hairColor", value: profile.appearance?.hairColor },
        { key: "eyeColor", value: profile.appearance?.eyeColor },
      ],
    },
    {
      id: "personal",
      fields: [
        { key: "maritalStatus", value: profile.personal?.maritalStatus },
        { key: "religion", value: profile.personal?.religion },
        { key: "education", value: profile.personal?.education },
        { key: "profession", value: profile.personal?.profession },
        { key: "annualIncome", value: profile.personal?.annualIncome },
        { key: "languages", value: profile.personal?.languages },
      ],
    },
    {
      id: "lifestyle",
      fields: [
        { key: "smoking", value: profile.lifestyle?.smoking },
        { key: "alcohol", value: profile.lifestyle?.alcohol },
        { key: "children", value: profile.lifestyle?.children },
        { key: "wantsChildren", value: profile.lifestyle?.wantsChildren },
      ],
    },
    {
      id: "about",
      fields: [
        { key: "aboutMe", value: profile.about?.aboutMe },
        { key: "hobbies", value: profile.about?.hobbies },
        { key: "lifeGoals", value: profile.about?.lifeGoals },
        { key: "relationshipExperience", value: profile.about?.relationshipExperience },
      ],
    },
    {
      id: "partner",
      fields: [
        { key: "lookingFor", value: profile.partner?.lookingFor },
        { key: "intent", value: profile.partner?.intent },
        { key: "ageRange", value: rangeApplicantValue(profile.partner?.ageMin, profile.partner?.ageMax, "") || null },
        { key: "heightRange", value: rangeApplicantValue(profile.partner?.heightMin, profile.partner?.heightMax, "") || null },
        { key: "bodyType", value: profile.partner?.bodyType },
        { key: "minimumEducation", value: profile.partner?.minimumEducation },
        { key: "importantQualities", value: profile.partner?.importantQualities },
        { key: "dealBreakers", value: profile.partner?.dealBreakers },
      ],
    },
    {
      id: "additional",
      fields: [
        { key: "instagram", value: profile.additional?.instagram },
        { key: "telegram", value: profile.additional?.telegram },
        { key: "howHeard", value: profile.additional?.howHeard },
      ],
    },
    {
      id: "screening",
      fields: [
        { key: "quizGoal", value: profile.screening?.quizGoal },
        { key: "quizGeography", value: profile.screening?.quizGeography },
        { key: "interviewReady", value: profile.screening?.interviewReady },
      ],
    },
  ];
}

export function applicationMetaSection(application?: ApplicationMeta | null): ApplicantSection {
  return {
    id: "application",
    fields: [
      { key: "status", value: application?.status },
      { key: "source", value: application?.source },
      { key: "createdAt", value: application?.created_at },
      { key: "updatedAt", value: application?.updated_at },
    ],
  };
}

export function applicantFromProfileRecord(
  profile: Record<string, unknown> | null | undefined,
  extras?: {
    email?: string | null;
    phone?: string | null;
    preferences?: Record<string, unknown> | null;
  }
): ApplicantProfileView {
  const row = profile || {};
  const details = detailsOf(row.details);
  const prefs = extras?.preferences || {};
  const prefDetails = detailsOf(prefs.details);
  return {
    basic: {
      firstName: firstText(row.first_name),
      lastName: text(row.last_name),
      email: firstText(extras?.email, row.email),
      phone: firstText(extras?.phone, row.phone),
      dateOfBirth: text(row.birth_date),
      gender: text(row.gender),
      city: firstText(row.city),
      country: text(row.country),
      nationality: firstText(details.nationality, row.nationality),
    },
    appearance: {
      height: number(row.height) ?? undefined,
      weight: number(details.weightKg ?? details.weight) ?? undefined,
      bodyType: firstText(details.bodyType, row.body_type),
      hairColor: firstText(details.hairColor, row.hair_color),
      eyeColor: firstText(details.eyeColor, row.eye_color),
    },
    personal: {
      maritalStatus: text(row.marital_status),
      religion: firstText(details.religion, row.religion),
      education: text(row.education),
      profession: firstText(row.occupation, details.profession),
      annualIncome: firstText(details.annualIncome, row.annual_income),
      languages: text(row.languages),
    },
    lifestyle: {
      smoking: firstText(details.smoking, row.smoking),
      alcohol: firstText(details.alcohol, row.alcohol),
      children: text(row.children),
      wantsChildren: firstText(details.wantsChildren, row.wants_children),
    },
    about: {
      aboutMe: firstText(row.about),
      hobbies: text(row.hobbies),
      lifeGoals: firstText(details.lifeGoals, details.goals),
      relationshipExperience: firstText(details.relationshipExperience, details.experience),
    },
    partner: {
      lookingFor: firstText(details.lookingFor, prefs.gender),
      ageMin: number(prefs.age_min) ?? undefined,
      ageMax: number(prefs.age_max) ?? undefined,
      heightMin: number(prefDetails.preferredHeightMin ?? prefDetails.heightMin) ?? undefined,
      heightMax: number(prefDetails.preferredHeightMax ?? prefDetails.heightMax) ?? undefined,
      bodyType: firstText(prefDetails.preferredBodyType, prefDetails.bodyType),
      minimumEducation: firstText(prefDetails.minimumEducation, prefDetails.education),
      importantQualities: firstText(prefDetails.importantQualities, prefDetails.qualities),
      dealBreakers: firstText(prefDetails.dealBreakers),
      intent: text(prefs.intent),
    },
    additional: {
      instagram: firstText(details.instagram, row.instagram),
      telegram: firstText(details.telegramHandle, details.telegram),
      howHeard: firstText(details.howHeard, details.heard),
    },
    screening: {
      quizGoal: firstText(details.quizGoal, details.goal),
      quizGeography: firstText(details.quizGeography, details.geography),
      interviewReady: bool(details.quizInterviewReady),
    },
  };
}
