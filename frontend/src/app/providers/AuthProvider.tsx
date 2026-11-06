import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError } from "../../shared/api/client";
import type { User } from "../../shared/api/types";
type AuthState = {
  user: User | null;
  loading: boolean;
  error: string;
  authenticate: (user: User) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};
const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function refresh() {
    setLoading(true);
    setError("");
    try {
      setUser(await api<User>("/me"));
    } catch (cause) {
      setUser(null);
      if (!(cause instanceof ApiError && cause.status === 401))
        setError(
          "We couldn’t connect to FORGE. Check your connection and try again.",
        );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
    const expire = () => setUser(null);
    window.addEventListener("session-expired", expire);
    return () => window.removeEventListener("session-expired", expire);
  }, []);
  async function logout() {
    await api("/auth/logout", "POST");
    setUser(null);
  }
  return (
    <AuthContext.Provider
      value={{ user, loading, error, authenticate: setUser, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider is required.");
  return context;
}
