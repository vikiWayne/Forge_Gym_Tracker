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
    title: "Fuel your stronger days.",
    eyebrow: "YOUR DAILY PROTEIN JOURNAL",
    description:
      "Keep a simple record of the protein you log. Little entries, a clearer picture.",
    unit: "g",
    label: "Protein (g)",
    action: "Log protein",
  },
  "body-weight": {
    title: "Your journey, one weigh-in at a time.",
    eyebrow: "YOUR BODY-WEIGHT JOURNAL",
    description:
      "Track your weight over time. Add a note about the day, if you like.",
    unit: "kg",
    label: "Body weight (kg)",
    action: "Log body weight",
  },
};
