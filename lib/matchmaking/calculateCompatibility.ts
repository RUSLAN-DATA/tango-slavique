export type CompatibilityPerson = {
  id: string;
  applyTrack: "WOMAN" | "MAN" | null;
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
  quizGoal: string | null;
  quizGeography: string | null;
  preferredAgeMin: number | null;
  preferredAgeMax: number | null;
  preferredHeightMin: number | null;
  preferredHeightMax: number | null;
  preferredBodyType: string | null;
  minimumEducation: string | null;
  importantQualities: string | null;
  dealBreakers: string | null;
};

export type CompatibilityResult = {
  compatibilityScore: number;
  positiveFactors: string[];
  potentialConflicts: string[];
  preferenceMatches: string[];
  preferenceConflicts: string[];
};

function ageYears(date: Date | null) {
  if (!date) {
    return null;
  }
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const month = now.getMonth() - date.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < date.getDate())) {
    age -= 1;
  }
  return age;
}

function normalize(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function overlapScore(a: string | null, b: string | null) {
  const left = normalize(a);
  const right = normalize(b);
  if (!left || !right) {
    return 0.5;
  }
  if (left === right) {
    return 1;
  }
  const leftParts = left.split(/[,/;]+/).map((part) => part.trim()).filter(Boolean);
  const rightParts = right.split(/[,/;]+/).map((part) => part.trim()).filter(Boolean);
  const shared = leftParts.filter((part) => rightParts.includes(part));
  if (shared.length) {
    return 0.8;
  }
  return 0.2;
}

function rangeScore(value: number | null, min: number | null, max: number | null) {
  if (value === null || (min === null && max === null)) {
    return 0.5;
  }
  if (min !== null && value < min) {
    return Math.max(0, 1 - (min - value) / 10);
  }
  if (max !== null && value > max) {
    return Math.max(0, 1 - (value - max) / 10);
  }
  return 1;
}

function familyScore(a: CompatibilityPerson, b: CompatibilityPerson) {
  const wants = overlapScore(a.wantsChildren, b.wantsChildren);
  const has = overlapScore(a.children, b.children);
  return (wants * 0.7 + has * 0.3);
}

export function calculateCompatibility(
  a: CompatibilityPerson,
  b: CompatibilityPerson
): CompatibilityResult {
  const goal = overlapScore(a.quizGoal || a.lifeGoals, b.quizGoal || b.lifeGoals);
  const values = (
    overlapScore(a.religion, b.religion) +
    overlapScore(a.education, b.education) +
    overlapScore(a.languages, b.languages)
  ) / 3;
  const lifestyle = (overlapScore(a.smoking, b.smoking) + overlapScore(a.alcohol, b.alcohol)) / 2;
  const family = familyScore(a, b);

  const ageA = ageYears(a.dateOfBirth);
  const ageB = ageYears(b.dateOfBirth);
  const age =
    (rangeScore(ageB, a.preferredAgeMin, a.preferredAgeMax) +
      rangeScore(ageA, b.preferredAgeMin, b.preferredAgeMax)) /
    2;

  const location = overlapScore(
    a.quizGeography || a.city || a.country,
    b.quizGeography || b.city || b.country
  );

  const other =
    (rangeScore(b.heightCm, a.preferredHeightMin, a.preferredHeightMax) +
      rangeScore(a.heightCm, b.preferredHeightMin, b.preferredHeightMax) +
      overlapScore(a.preferredBodyType, b.bodyType) +
      overlapScore(b.preferredBodyType, a.bodyType)) /
    4;

  const compatibilityScore = Math.round(
    (goal * 0.2 +
      values * 0.2 +
      lifestyle * 0.15 +
      family * 0.15 +
      age * 0.15 +
      location * 0.1 +
      other * 0.05) *
      100
  );

  const positiveFactors: string[] = [];
  const potentialConflicts: string[] = [];
  const preferenceMatches: string[] = [];
  const preferenceConflicts: string[] = [];

  if (goal >= 0.8) positiveFactors.push("Aligned relationship goals");
  else if (goal <= 0.3) potentialConflicts.push("Different relationship goals");

  if (values >= 0.75) positiveFactors.push("Compatible values and education");
  else if (values <= 0.35) potentialConflicts.push("Limited overlap in values");

  if (lifestyle >= 0.8) positiveFactors.push("Similar lifestyle habits");
  else if (lifestyle <= 0.35) potentialConflicts.push("Lifestyle habits may conflict");

  if (family >= 0.8) positiveFactors.push("Family intentions correspond");
  else if (family <= 0.35) potentialConflicts.push("Family plans may not correspond");

  if (age >= 0.8) preferenceMatches.push("Age range is mutually suitable");
  else if (age <= 0.4) preferenceConflicts.push("Age is outside stated preference");

  if (location >= 0.7) preferenceMatches.push("Geography is compatible");
  else preferenceConflicts.push("Location preference is only a partial match");

  if (other >= 0.75) preferenceMatches.push("Appearance preferences correspond");
  else if (other <= 0.4) preferenceConflicts.push("Appearance preferences may conflict");

  const aBreakers = normalize(a.dealBreakers);
  const bBreakers = normalize(b.dealBreakers);
  if (aBreakers && (normalize(b.smoking).includes(aBreakers) || normalize(b.religion) === aBreakers)) {
    preferenceConflicts.push("Possible deal-breaker for member A");
  }
  if (bBreakers && (normalize(a.smoking).includes(bBreakers) || normalize(a.religion) === bBreakers)) {
    preferenceConflicts.push("Possible deal-breaker for member B");
  }

  return {
    compatibilityScore,
    positiveFactors,
    potentialConflicts,
    preferenceMatches,
    preferenceConflicts,
  };
}
