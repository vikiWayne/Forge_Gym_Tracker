import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "../../shared/api/client";
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
  refresh: () => Promise<void>;
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
  const refresh = useCallback(async () => {
    const [training, plans] = await Promise.all([
      api<Omit<TrainingData, "plans">>("/data"),
      api<Plan[]>("/plans"),
    ]);
    setData({ ...training, plans });
    setError("");
  }, []);
  useEffect(() => {
    refresh()
      .catch((cause) => setError(cause.message))
      .finally(() => setLoading(false));
  }, [refresh]);
  return (
    <TrainingContext.Provider value={{ ...data, loading, error, refresh }}>
      {children}
    </TrainingContext.Provider>
  );
}
export function useTraining() {
  const context = useContext(TrainingContext);
  if (!context) throw new Error("TrainingProvider is required.");
  return context;
}
