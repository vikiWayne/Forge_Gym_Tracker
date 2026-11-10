export type RecoveryEntry = {
  id: string;
  date: string;
  sleep_hours: number;
  energy: number;
  soreness: number;
  mood: number;
  notes: string;
};
export const recoveryRatings = {
  energy: ["Very low", "Low", "Steady", "High", "Very high"],
  soreness: ["None", "Mild", "Moderate", "High", "Very high"],
  mood: ["Very low", "Low", "Okay", "Good", "Very good"],
};
