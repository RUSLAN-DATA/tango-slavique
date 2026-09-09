export type QuizGoal = "family" | "longterm";
export type QuizGeography = "spain" | "europe" | "international";

export type QuizResult = {
  goal: QuizGoal;
  geography: QuizGeography;
  interviewReady: true;
};

export const cityKeys = [
  "barcelona",
  "madrid",
  "valencia",
  "marbella",
  "other",
] as const;

export type CityKey = (typeof cityKeys)[number];
