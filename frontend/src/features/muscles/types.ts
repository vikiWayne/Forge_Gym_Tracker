export type MuscleExercise = {
  id: string;
  name: string;
  category: string;
  muscles: string[];
};
export type MuscleData = {
  groups: string[];
  week: { start: string; end: string; today: string };
  exercises: MuscleExercise[];
  summary: { muscle: string; sets: number }[];
  untagged_sets: number;
};
