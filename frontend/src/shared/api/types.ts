export type Category = { id: string; name: string };
export type WorkoutSet = { weight: number; reps: number };
export type User = {
  id: string;
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
  id: string;
  name: string;
  owner_id: string;
  accepted: number;
  members: { id: string; username: string }[];
  logs: Log[];
};
