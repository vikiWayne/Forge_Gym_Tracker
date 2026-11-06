import { z } from "zod";
export const credentialsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(128),
});
export const profileSchema = z.object({
  age: z.number().int().min(13).max(110),
  weight: z.number().positive().max(500),
  sex: z.enum(["Female", "Male", "Other", "Prefer not to say"]),
});
export const registrationSchema = credentialsSchema.extend(profileSchema.shape);
