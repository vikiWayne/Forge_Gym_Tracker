import { useEffect, useState } from "react";
import { api } from "../api/client";
export type Availability =
  "idle" | "invalid" | "checking" | "available" | "taken" | "error";
export function useUsernameAvailability(
  value: string,
  currentUsername?: string,
) {
  const [result, setResult] = useState<{ value: string; status: Availability }>(
    { value: "", status: "idle" },
  );
  const username = value.trim();
  const valid = /^[a-zA-Z0-9_]{3,30}$/.test(username);
  useEffect(() => {
    if (!username || !valid) return;
    if (currentUsername?.toLowerCase() === username.toLowerCase()) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const path = currentUsername
        ? "/me/username-availability"
        : "/auth/username-availability";
      void api<{ available: boolean }>(
        `${path}?username=${encodeURIComponent(username)}`,
        "GET",
        undefined,
        controller.signal,
      )
        .then((data) =>
          setResult({
            value: username,
            status: data.available ? "available" : "taken",
          }),
        )
        .catch((error) => {
          if (error.name !== "AbortError")
            setResult({ value: username, status: "error" });
        });
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [username, currentUsername, valid]);
  if (!username) return "idle";
  if (!valid) return "invalid";
  if (currentUsername?.toLowerCase() === username.toLowerCase())
    return "available";
  return result.value === username ? result.status : "checking";
}
