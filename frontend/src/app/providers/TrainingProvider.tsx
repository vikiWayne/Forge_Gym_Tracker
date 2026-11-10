import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError } from "../../shared/api/client";
import type { Category, Exercise, Log, Plan } from "../../shared/api/types";
type TrainingData = {
  categories: Category[];
  exercises: Exercise[];
  logs: Log[];
  plans: Plan[];
};
type TrainingState = TrainingData & {
  loading: boolean;
  error: string;
  invitationError: string;
  refresh: () => Promise<void>;
  refreshInvitations: () => Promise<void>;
};
const TrainingContext = createContext<TrainingState | null>(null);
export function TrainingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<TrainingData>({
    categories: [],
    exercises: [],
    logs: [],
    plans: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invitationError, setInvitationError] = useState("");
  const version = useRef(0);
  const refreshInvitations = useCallback(async () => {
    const request = ++version.current;
    try {
      const plans = await api<Plan[]>("/plans");
      if (request === version.current) {
        setData((previous) => ({ ...previous, plans }));
        setInvitationError("");
      }
    } catch (cause) {
      if (!(cause instanceof ApiError)) {
        setData((previous) => ({ ...previous, plans: [] }));
        setInvitationError(
          "Shared plans need a connection. Your personal training is available offline.",
        );
        return;
      }
      if (request === version.current)
        setInvitationError(
          "Invitations could not be refreshed. Please try again.",
        );
      throw cause;
    }
  }, []);
  const refresh = useCallback(async () => {
    const [training] = await Promise.all([
      api<Omit<TrainingData, "plans">>("/data"),
      refreshInvitations(),
    ]);
    setData((previous) => ({ ...previous, ...training }));
    setError("");
  }, [refreshInvitations]);
  useEffect(() => {
    refresh()
      .catch((cause) => setError(cause.message))
      .finally(() => setLoading(false));
  }, [refresh]);
  useEffect(() => {
    const synced = () => {
      void refresh().catch((cause) => setError(cause.message));
    };
    window.addEventListener("forge:workout-synced", synced);
    return () => window.removeEventListener("forge:workout-synced", synced);
  }, [refresh]);
  useEffect(() => {
    let checking = false;
    const check = () => {
      if (document.visibilityState !== "visible" || checking) return;
      checking = true;
      void refreshInvitations()
        .catch(() => {})
        .finally(() => {
          checking = false;
        });
    };
    const interval = window.setInterval(check, 30000);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
      version.current++;
    };
  }, [refreshInvitations]);
  return (
    <TrainingContext.Provider
      value={{
        ...data,
        loading,
        error,
        invitationError,
        refresh,
        refreshInvitations,
      }}
    >
      {children}
    </TrainingContext.Provider>
  );
}
export function useTraining() {
  const context = useContext(TrainingContext);
  if (!context) throw new Error("TrainingProvider is required.");
  return context;
}
