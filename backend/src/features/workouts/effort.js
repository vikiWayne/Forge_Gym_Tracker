import { z } from "zod";

export const effortFields = {
  rpe: z.number().min(1).max(10).multipleOf(0.5).nullable().optional(),
  rir: z.number().int().min(0).max(10).nullable().optional(),
};
