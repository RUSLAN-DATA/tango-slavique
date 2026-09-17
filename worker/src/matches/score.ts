export type MatchProfile = {
  userId: string;
  gender: string | null;
  birthDate: string | null;
  city: string | null;
  country: string | null;
  maritalStatus: string | null;
  children: string | null;
  languages: string | null;
};

export type MatchPreferences = {
  gender: string | null;
  ageMin: number | null;
  ageMax: number | null;
  city: string | null;
  maritalStatus: string | null;
  children: string | null;
  languages: string | null;
  intent: string | null;
};

function ageFromBirthDate(birthDate: string | null): number | null {
  if (!birthDate) {
    return null;
  }
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) {
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

function normalize(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

function overlap(left: string | null, right: string | null): boolean {
  const a = normalize(left);
  const b = normalize(right);
  if (!a || !b) {
    return false;
  }
  const aParts = a.split(/[,/;]+/).map((part) => part.trim()).filter(Boolean);
  const bParts = b.split(/[,/;]+/).map((part) => part.trim()).filter(Boolean);
  return aParts.some((part) => bParts.includes(part));
}

export function calculateMatchScore(
  candidate: MatchProfile,
  preferences: MatchPreferences
): number {
  let score = 0;
  if (preferences.gender && normalize(candidate.gender) === normalize(preferences.gender)) {
    score += 30;
  }
  const age = ageFromBirthDate(candidate.birthDate);
  if (
    age !== null &&
    (preferences.ageMin === null || age >= preferences.ageMin) &&
    (preferences.ageMax === null || age <= preferences.ageMax)
  ) {
    score += 20;
  }
  if (preferences.city && normalize(candidate.city) === normalize(preferences.city)) {
    score += 20;
  }
  if (
    preferences.maritalStatus &&
    normalize(candidate.maritalStatus) === normalize(preferences.maritalStatus)
  ) {
    score += 10;
  }
  if (preferences.children && normalize(candidate.children) === normalize(preferences.children)) {
    score += 10;
  }
  if (overlap(candidate.languages, preferences.languages)) {
    score += 10;
  }
  return score;
}
