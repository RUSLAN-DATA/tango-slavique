import { z } from "zod";
import { ApplyTrack } from "@prisma/client";

const optionalText = z.string().max(2000).optional().or(z.literal(""));
const optionalShort = z.string().max(160).optional().or(z.literal(""));

export const applicationDraftSchema = z.object({
  currentStep: z.number().int().min(1).max(7).optional(),
  track: z.nativeEnum(ApplyTrack).optional(),
  language: z.enum(["en", "es"]).optional(),
  quizGoal: optionalShort,
  quizGeography: optionalShort,
  quizInterviewReady: z.boolean().optional(),
  lookingFor: optionalShort,
  firstName: optionalShort,
  lastName: optionalShort,
  phone: optionalShort,
  dateOfBirth: z.string().optional().or(z.literal("")),
  city: optionalShort,
  country: optionalShort,
  heightCm: z.number().int().min(120).max(230).optional().nullable(),
  weightKg: z.number().int().min(35).max(250).optional().nullable(),
  bodyType: optionalShort,
  hairColor: optionalShort,
  eyeColor: optionalShort,
  nationality: optionalShort,
  maritalStatus: optionalShort,
  religion: optionalShort,
  education: optionalShort,
  profession: optionalShort,
  annualIncome: optionalShort,
  languages: optionalShort,
  smoking: optionalShort,
  alcohol: optionalShort,
  children: optionalShort,
  wantsChildren: optionalShort,
  aboutMe: optionalText,
  hobbies: optionalText,
  lifeGoals: optionalText,
  relationshipExperience: optionalText,
  instagram: optionalShort,
  telegramHandle: optionalShort,
  howHeard: optionalShort,
  preferredAgeMin: z.number().int().min(18).max(99).optional().nullable(),
  preferredAgeMax: z.number().int().min(18).max(99).optional().nullable(),
  preferredHeightMin: z.number().int().min(120).max(230).optional().nullable(),
  preferredHeightMax: z.number().int().min(120).max(230).optional().nullable(),
  preferredBodyType: optionalShort,
  minimumEducation: optionalShort,
  importantQualities: optionalText,
  dealBreakers: optionalText,
  privacyAccepted: z.boolean().optional(),
  termsAccepted: z.boolean().optional(),
});

export const applicationSubmitSchema = applicationDraftSchema.extend({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  phone: z.string().min(6).max(40),
  dateOfBirth: z.string().min(8),
  city: z.string().min(1).max(80),
  country: z.string().min(1).max(80),
  aboutMe: z.string().min(20).max(4000),
  privacyAccepted: z.literal(true),
  termsAccepted: z.literal(true),
});

export type ApplicationDraftInput = z.infer<typeof applicationDraftSchema>;
