export type Category = { id: string; name: string };
export type WorkoutSet = {
  weight: number;
  reps: number;
  rpe?: number | null;
  rir?: number | null;
};
export type RoutineExercise = { exercise_id: string; sets: WorkoutSet[] };
export type Routine = {
  id: string;
  name: string;
  notes: string;
  exercises: RoutineExercise[];
};
export type TrainingSession = {
  id: string;
  name: string;
  started_at: number;
  finished_at: number | null;
  exercises: {
    exercise_id: string;
    name: string;
    sets: (WorkoutSet & { done: boolean })[];
  }[];
  rest_seconds: number;
  rest_until: number | null;
  notes: string;
};
export type User = {
  id: string;
  email: string;
  username: string;
  age: number;
  weight: number;
  sex: string;
};
export type Exercise = {
  category_id: string;
  rep_min?: number;
  rep_max?: number;
  id: string;
  name: string;
  category: string;
  notes: string;
  ready: number;
};
export type Log = {
  pending_sync?: boolean;
  sets: WorkoutSet[];
  user_id?: string;
  id: string;
  exercise_id: string;
  weight: number;
  reps: number;
  date: string;
  notes: string;
  name?: string;
  username?: string;
};
export type Plan = {
  sharing: {
    mode: "none" | "selected" | "all";
    include_notes: boolean;
    selected_log_ids: string[];
  };
  id: string;
  name: string;
  owner_id: string;
  owner_name: string;
  pending_invites: { id: string; username: string }[];
  accepted: number;
  members: { id: string; username: string }[];
  logs: Log[];
};
