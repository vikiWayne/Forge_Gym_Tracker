import { appFetch } from "../../shared/api/transport";
export type CsvSummary = {
  workouts: number;
  importing: number;
  skipped: number;
  sets: number;
  newCategories: number;
  newExercises: number;
  settingsKept: number;
  preview: {
    id: string;
    date: string;
    category: string;
    exercise: string;
    sets: number;
  }[];
};
function expired(status: number) {
  if (status === 401) window.dispatchEvent(new Event("session-expired"));
}
export async function checkWorkoutCsv(
  csv: string,
  action: "preview" | "import",
): Promise<CsvSummary> {
  const response = await appFetch(`/api/workout-csv/${action}`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "text/csv; charset=utf-8" },
    body: csv,
  });
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw new Error("The server is unavailable. Please try again shortly.");
  const result = await response.json();
  if (!response.ok) {
    expired(response.status);
    throw new Error(result.error || "The CSV could not be processed.");
  }
  return result;
}
export async function downloadWorkoutCsv() {
  const response = await appFetch("/api/workout-csv/export", {
    credentials: "same-origin",
  });
  if (!response.ok) {
    expired(response.status);
    throw new Error("The CSV could not be exported. Please try again.");
  }
  if (!response.headers.get("content-type")?.includes("text/csv"))
    throw new Error("The server did not return a CSV file.");
  const url = URL.createObjectURL(await response.blob()),
    anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `forge-workouts-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
