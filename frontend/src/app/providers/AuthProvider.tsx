import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError } from "../../shared/api/client";
import type { User } from "../../shared/api/types";
import {
  cachedUser,
  clearOffline,
  setOfflineUser,
  locallySignedOut,
  signOutLocally,
  pendingWorkouts,
} from "../../features/offline/storage";
import { syncWorkouts } from "../../features/offline/sync";
import { Modal } from "../../shared/ui/Modal";
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
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const signOutDecision = useRef<((proceed: boolean) => void) | null>(null);
  function decideSignOut(proceed: boolean) {
    setConfirmSignOut(false);
    signOutDecision.current?.(proceed);
    signOutDecision.current = null;
  }
  async function refresh() {
    setLoading(true);
    setError("");
    if (locallySignedOut()) {
      try {
        await api("/auth/logout", "POST");
      } catch {}
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const verified = await api<User>("/me");
      setOfflineUser(verified);
      setUser(verified);
      void syncWorkouts();
    } catch (cause) {
      const saved = !(cause instanceof ApiError) ? cachedUser() : null;
      if (saved) {
        setOfflineUser(saved, false);
        setUser(saved);
      } else {
        setUser(null);
        if (cause instanceof ApiError && cause.status === 401) clearOffline();
        else
          setError(
            "We couldn’t connect to FORGE. Check your connection and try again.",
          );
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
    const expire = () => {
      window.dispatchEvent(new Event("forge:pause-lock-screen"));
      clearOffline();
      setUser(null);
    };
    window.addEventListener("session-expired", expire);
    return () => window.removeEventListener("session-expired", expire);
  }, []);
  function authenticate(nextUser: User) {
    setOfflineUser(nextUser);
    setError("");
    setUser(nextUser);
    setLoading(false);
  }
  async function logout() {
    if (signOutDecision.current) return;
    if (pendingWorkouts().length) {
      const proceed = await new Promise<boolean>((resolve) => {
        signOutDecision.current = resolve;
        setConfirmSignOut(true);
      });
      if (!proceed) return;
    }
    try {
      await api("/auth/logout", "POST");
    } finally {
      window.dispatchEvent(new Event("forge:pause-lock-screen"));
      signOutLocally();
      setUser(null);
    }
  }
  return (
    <AuthContext.Provider
      value={{ user, loading, error, authenticate, logout, refresh }}
    >
      {children}
      {confirmSignOut && (
        <Modal
          title="You have unsynced workouts"
          close={() => decideSignOut(false)}
        >
          <p>
            Your queued workouts are still on this device. Signing out clears
            those device copies. Workouts already saved to your account stay in
            your journal.
          </p>
          <p className="field-hint">
            Stay signed in and reconnect to sync first, or choose to sign out
            and clear the device.
          </p>
          <div className="form-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => decideSignOut(false)}
            >
              Keep my workouts
            </button>
            <button
              type="button"
              className="button danger"
              onClick={() => decideSignOut(true)}
            >
              Sign out & clear device
            </button>
          </div>
        </Modal>
      )}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider is required.");
  return context;
}
