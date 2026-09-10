import { z } from "zod";
import { ApplyTrack } from "@prisma/client";

export const registerSchema = z.object({
  email: z.string().email().max(180).transform((value) => value.toLowerCase().trim()),
  password: z.string().min(8).max(72),
  firstName: z.string().min(1).max(80).trim(),
  lastName: z.string().min(1).max(80).trim(),
  applyTrack: z.nativeEnum(ApplyTrack).optional(),
  next: z
    .string()
    .max(200)
    .optional()
    .refine((value) => !value || value.startsWith("/"), "Invalid redirect"),
});

export const loginSchema = z.object({
  email: z.string().email().max(180).transform((value) => value.toLowerCase().trim()),
  password: z.string().min(1).max(72),
});

export const emailSchema = z.object({
  email: z.string().email().max(180).transform((value) => value.toLowerCase().trim()),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16).max(200),
  password: z.string().min(8).max(72),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(16).max(200),
});
