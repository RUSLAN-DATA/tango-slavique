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
  id: "profile" | "appearance" | "personal" | "lifestyle" | "about" | "partner" | "additional" | "screening";
  fields: ApplicantField[];
};

export function displayApplicantValue(
  value: string | number | boolean | null | undefined,
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
  const text = String(value).trim();
  return text ? text : empty;
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
        { key: "ageRange", value: rangeApplicantValue(profile.partner?.ageMin, profile.partner?.ageMax, "") || null },
        { key: "heightRange", value: rangeApplicantValue(profile.partner?.heightMin, profile.partner?.heightMax, "") || null },
        { key: "bodyType", value: profile.partner?.bodyType },
        { key: "minimumEducation", value: profile.partner?.minimumEducation },
        { key: "importantQualities", value: profile.partner?.importantQualities },
        { key: "dealBreakers", value: profile.partner?.dealBreakers },
        { key: "intent", value: profile.partner?.intent },
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
