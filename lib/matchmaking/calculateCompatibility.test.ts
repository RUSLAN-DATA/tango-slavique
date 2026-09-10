import { describe, expect, it } from "vitest";
import { calculateCompatibility } from "./calculateCompatibility";

const base = {
  id: "a",
  applyTrack: "MAN" as const,
  dateOfBirth: new Date("1985-01-01"),
  city: "Barcelona",
  country: "Spain",
  heightCm: 180,
  bodyType: "athletic",
  education: "university",
  religion: "christian",
  smoking: "no",
  alcohol: "occasionally",
  children: "no",
  wantsChildren: "yes",
  lifeGoals: "family",
  relationshipExperience: "serious",
  languages: "english, spanish",
  quizGoal: "family",
  quizGeography: "spain",
  preferredAgeMin: 28,
  preferredAgeMax: 42,
  preferredHeightMin: 160,
  preferredHeightMax: 180,
  preferredBodyType: "athletic",
  minimumEducation: "university",
  importantQualities: "discretion",
  dealBreakers: "smoking",
};

describe("calculateCompatibility", () => {
  it("scores aligned members highly", () => {
    const result = calculateCompatibility(base, {
      ...base,
      id: "b",
      applyTrack: "WOMAN",
      dateOfBirth: new Date("1990-06-01"),
      heightCm: 168,
    });
    expect(result.compatibilityScore).toBeGreaterThan(70);
    expect(result.positiveFactors.length).toBeGreaterThan(0);
  });

  it("flags conflicting family plans", () => {
    const result = calculateCompatibility(base, {
      ...base,
      id: "b",
      applyTrack: "WOMAN",
      wantsChildren: "no",
      children: "no",
      quizGoal: "longterm",
    });
    expect(result.compatibilityScore).toBeLessThan(100);
  });
});
