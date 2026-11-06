import { z } from "zod";
export function decimalNumber(min, max) {
  return z
    .number()
    .min(min)
    .max(max)
    .refine(
      (value) => Number(value.toFixed(2)) === value,
      "Use no more than 2 decimal places.",
    );
}
export const bodyWeightSchema = decimalNumber(0.01, 500);
export const liftWeightSchema = decimalNumber(0, 1500);
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (value) =>
      !Number.isNaN(Date.parse(value)) &&
      new Date(value).toISOString().slice(0, 10) === value,
    "Use a valid date.",
  )
  .refine(
    (value) =>
      value <=
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date()),
    "Future dates are not allowed.",
  );
