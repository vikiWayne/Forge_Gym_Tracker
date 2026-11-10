export type ScheduledWorkout = {
  id: string;
  routine_id: string | null;
  routine_name: string;
  date: string;
  notes: string;
  completed_session_id: string | null;
  completed_log_id: string | null;
  completed_at: number | null;
  logged_workouts: number;
};
export type CompletedSession = {
  id: string;
  name: string;
  started_at: number;
  finished_at: number;
};
export function indiaSessionDate(time: number) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(time));
}
