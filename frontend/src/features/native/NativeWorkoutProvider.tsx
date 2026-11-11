import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { App } from "@capacitor/app";
import { LocalNotifications } from "@capacitor/local-notifications";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { api, ApiError } from "../../shared/api/client";
import type { TrainingSession } from "../../shared/api/types";
import { readOffline } from "../offline/storage";
import { WORKOUT_CHANGED } from "./events";
import { savedActivity, saveActivity } from "./preferences";
import { workoutDeepLink, workoutStatus } from "./workoutStatus";
import {
  WorkoutActivity,
  cancelRestAlert,
  isNative,
  nativeOperation,
  prepareRestAlerts,
  syncRestAlert,
} from "./bridge";

type NativeState = {
  enabled: boolean;
  busy: boolean;
  error: string;
  enable: (session: TrainingSession) => Promise<void>;
  stop: () => void;
};
const Context = createContext<NativeState | null>(null);

export function NativeWorkoutProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const activeId = useRef<string | null>(null);
  const owner = useRef(user?.id);
  const revision = useRef(0);
  const rest = useRef<number | null | undefined>(undefined);
  owner.current = user?.id;

  function stop() {
    ++revision.current;
    activeId.current = null;
    rest.current = undefined;
    setEnabled(false);
    if (owner.current) saveActivity(owner.current, null);
    if (isNative())
      void nativeOperation(async () => {
        await WorkoutActivity.end();
        await cancelRestAlert();
      }).catch(() =>
        setError("Open FORGE again to clear its lock-screen status."),
      );
  }
  function sync(session: TrainingSession | null) {
    if (!activeId.current) return;
    const status = session && workoutStatus(session);
    if (!status || activeId.current !== status.sessionId) {
      stop();
      return;
    }
    const version = revision.current;
    void nativeOperation(async () => {
      if (version !== revision.current) return;
      await WorkoutActivity.update(status);
      if (rest.current !== status.restUntil) {
        await syncRestAlert(status);
        rest.current = status.restUntil;
      }
    }).catch(() =>
      setError(
        "Lock-screen status could not update. Your workout is still saved in FORGE.",
      ),
    );
  }
  async function enable(session: TrainingSession) {
    if (!isNative() || !user || busy) return;
    setBusy(true);
    setError("");
    const requestedOwner = user.id;
    const requestedRevision = revision.current;
    try {
      const status = workoutStatus(session);
      if (!status)
        throw new Error(
          "Resume a workout started within the last eight hours first.",
        );
      const alerts = await prepareRestAlerts();
      const availability = await WorkoutActivity.availability();
      if (!availability.supported || !availability.enabled)
        throw new Error(
          "Allow Live Activities or workout notifications in your phone's FORGE settings first.",
        );
      if (
        owner.current !== requestedOwner ||
        revision.current !== requestedRevision
      )
        return;
      ++revision.current;
      activeId.current = session.id;
      saveActivity(requestedOwner, session.id);
      setEnabled(true);
      await nativeOperation(async () => {
        if (owner.current !== requestedOwner || activeId.current !== session.id)
          return;
        await WorkoutActivity.update({ ...status, start: true });
        if (alerts) {
          await syncRestAlert(status);
          rest.current = status.restUntil;
        }
      });
      if (!alerts)
        setError(
          "Lock-screen status is on. Allow notifications in Settings if you also want rest alerts.",
        );
    } catch (cause) {
      stop();
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to enable lock-screen status.",
      );
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!isNative() || loading) return;
    let disposed = false;
    activeId.current = user ? savedActivity(user.id) : null;
    setEnabled(!!activeId.current);
    rest.current = undefined;
    const reconcile = async () => {
      if (!user || !activeId.current) {
        stop();
        return;
      }
      try {
        const session = await api<TrainingSession | null>("/training-session");
        const draft = readOffline<TrainingSession>("active-draft");
        if (!disposed)
          sync(session && draft?.id === session.id ? draft : session);
      } catch (cause) {
        if (!disposed && cause instanceof ApiError && cause.status === 401)
          stop();
        // A transient network failure must not end a valid offline workout.
      }
    };
    void reconcile();
    const change = (event: Event) => {
      const session = (event as CustomEvent<TrainingSession | null>).detail;
      if (session) sync(session);
      else stop();
    };
    const pause = () => stop();
    window.addEventListener(WORKOUT_CHANGED, change);
    window.addEventListener("forge:pause-lock-screen", pause);
    const appState = App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) void reconcile();
    });
    const appUrl = App.addListener("appUrlOpen", ({ url }) => {
      const path = workoutDeepLink(url);
      if (path) navigate(path);
    });
    const alertTap = LocalNotifications.addListener(
      "localNotificationActionPerformed",
      ({ notification }) => {
        if (notification.extra?.route === "/workouts/active")
          navigate("/workouts/active");
      },
    );
    void App.getLaunchUrl().then((result) => {
      const path = result && workoutDeepLink(result.url);
      if (!disposed && path) navigate(path);
    });
    return () => {
      disposed = true;
      ++revision.current;
      window.removeEventListener(WORKOUT_CHANGED, change);
      window.removeEventListener("forge:pause-lock-screen", pause);
      void appState.then((handle) => handle.remove());
      void appUrl.then((handle) => handle.remove());
      void alertTap.then((handle) => handle.remove());
      if (user && owner.current !== user.id) saveActivity(user.id, null);
      activeId.current = null;
      void nativeOperation(async () => {
        await WorkoutActivity.end();
        await cancelRestAlert();
      }).catch(() => {});
    };
    // Event handlers use refs for current activity; rebuild only on identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, loading]);

  return (
    <Context.Provider value={{ enabled, busy, error, enable, stop }}>
      {children}
    </Context.Provider>
  );
}
export function useNativeWorkout() {
  const value = useContext(Context);
  if (!value) throw new Error("NativeWorkoutProvider is required.");
  return value;
}
