import {
  enqueueWorkout,
  offlineAccount,
  pendingWorkouts,
  readOffline,
  writeOffline,
} from "../../features/offline/storage";
import { syncWorkouts } from "../../features/offline/sync";
import { validOfflineWorkout } from "../../features/offline/validation";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T = void>(
  path: string,
  method = "GET",
  data?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const isNewWorkout =
    path === "/logs" &&
    method === "POST" &&
    typeof data === "object" &&
    data !== null;
  const payload = isNewWorkout
    ? {
        ...data,
        client_id:
          (data as { client_id?: string }).client_id || crypto.randomUUID(),
      }
    : data;
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      signal,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
  } catch (cause) {
    if (signal?.aborted) throw cause;
    if (isNewWorkout && offlineAccount()) {
      const body = payload as Record<string, unknown>;
      if (!validOfflineWorkout(body))
        throw new ApiError(
          "Check your workout date, sets and notes before saving offline.",
          400,
        );
      enqueueWorkout(String(body.client_id), body);
      return { id: body.client_id, queued: true } as T;
    }
    if (method === "GET" && path === "/data") {
      const saved = readOffline<Record<string, unknown>>("training");
      if (saved) return withPending(saved) as T;
    }
    throw cause;
  }
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new ApiError(
      "The server is unavailable. Please try again shortly.",
      response.status,
    );
  }
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401)
      window.dispatchEvent(new Event("session-expired"));
    throw new ApiError(
      result.error || "Unable to complete your request.",
      response.status,
    );
  }
  if (method === "GET" && path === "/data" && offlineAccount()) {
    try {
      writeOffline("training", result);
    } catch {}
    return withPending(result) as T;
  }
  if (isNewWorkout) void syncWorkouts();
  return result;
}
function withPending(data: Record<string, unknown>) {
  const logs = Array.isArray(data.logs) ? data.logs : [];
  const queued = pendingWorkouts()
    .filter((item) => !logs.some((log: { id: string }) => log.id === item.id))
    .map((item) => {
      const sets = item.body.sets as { weight: number; reps: number }[];
      const best = sets.reduce((a, b) => (b.weight > a.weight ? b : a));
      return { ...item.body, ...best, id: item.id, sets, pending_sync: true };
    });
  return {
    ...data,
    logs: [...queued, ...logs].sort((a, b) =>
      String(b.date).localeCompare(String(a.date)),
    ),
  };
}
