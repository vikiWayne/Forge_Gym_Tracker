export type TrackerKind = "protein" | "body-weight";
export type TrackerEntry = {
  id: string;
  value: number;
  date: string;
  label: string;
  notes: string;
};
export const trackerConfig = {
  protein: {
    title: "Fuel your day.",
    eyebrow: "YOUR DAILY PROTEIN JOURNAL",
    description: "Log protein and follow the target you choose.",
    unit: "g",
    label: "Protein (g)",
    action: "Log protein",
  },
  "body-weight": {
    title: "Your weight, in context.",
    eyebrow: "YOUR BODY-WEIGHT JOURNAL",
    description: "Record your measurements and see your own trend.",
    unit: "kg",
    label: "Body weight (kg)",
    action: "Log body weight",
  },
};
