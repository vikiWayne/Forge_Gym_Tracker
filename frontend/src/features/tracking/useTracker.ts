import { useCallback, useEffect, useState } from "react";
import { api } from "../../shared/api/client";
import type { TrackerEntry, TrackerKind } from "./types";
export function useTracker(kind: TrackerKind) {
  const [entries, setEntries] = useState<TrackerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    const result = await api<{ entries: TrackerEntry[] }>(`/${kind}`);
    setEntries(result.entries);
    setError("");
  }, [kind]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    void api<{ entries: TrackerEntry[] }>(`/${kind}`)
      .then((result) => {
        if (active) {
          setEntries(result.entries);
          setError("");
        }
      })
      .catch((cause) => {
        if (active) setError(cause.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [kind]);
  return { entries, loading, error, refresh };
}
