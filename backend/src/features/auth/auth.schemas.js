import { bodyWeightSchema } from "../../shared/validation.js";
import { z } from "zod";
export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Use at least 3 characters.")
  .max(30, "Use at most 30 characters.")
  .regex(/^[a-zA-Z0-9_]+$/, "Use only letters, numbers and underscores.");
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(128);
export const credentialsSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});
export const profileSchema = z.object({
  age: z.number().int().min(13).max(110),
  weight: bodyWeightSchema,
  sex: z.enum(["Female", "Male", "Other", "Prefer not to say"]),
});
export const registrationSchema = credentialsSchema.extend(profileSchema.shape);
