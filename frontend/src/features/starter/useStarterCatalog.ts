import { useEffect, useState } from "react";
import { api } from "../../shared/api/client";

export type CatalogMovement = {
  id: string;
  name: string;
  equipment: string;
  focus: string;
  cues: string[];
};
export type StarterCatalog = {
  movements: CatalogMovement[];
  starters: {
    id: string;
    name: string;
    equipment: string;
    movements: { id: string; sets: number; reps: number }[];
  }[];
};

export function useStarterCatalog() {
  const [catalog, setCatalog] = useState<StarterCatalog>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void api<StarterCatalog>(
      "/starter-catalog",
      "GET",
      undefined,
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted) setCatalog(data);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError(
            "Couldn’t load the starter library. Check your connection and retry.",
          );
      });
    return () => controller.abort();
  }, [attempt]);
  return {
    catalog,
    error,
    retry: () => {
      setError("");
      setAttempt((value) => value + 1);
    },
  };
}
