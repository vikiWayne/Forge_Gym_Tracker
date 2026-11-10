import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "../../shared/api/client";
import type { TrainingSession } from "../../shared/api/types";
import { readOffline, writeOffline } from "../offline/storage";

export function useActiveSession() {
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const latest = useRef<TrainingSession | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dirty = useRef(false);
  const save = useCallback((next: TrainingSession) => {
    setSaving(true);
    const task = queue.current
      .catch(() => {})
      .then(() => api(`/training-session/${next.id}`, "PUT", next));
    queue.current = task;
    void task
      .then(() => {
        if (latest.current === next) {
          dirty.current = false;
          try {
            writeOffline("active-session", next);
            writeOffline("active-draft", null);
          } catch {}
          setError("");
        }
      })
      .catch((cause) =>
        setError(
          cause instanceof ApiError
            ? cause.message
            : "Your active workout draft is saved on this device. Reconnect before finishing or discarding it.",
        ),
      )
      .finally(() => {
        if (queue.current === task) setSaving(false);
      });
    return task;
  }, []);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const value = await api<TrainingSession | null>("/training-session");
      const draft = readOffline<TrainingSession>("active-draft");
      const restored = value && draft?.id === value.id ? draft : value;
      latest.current = restored;
      setSession(restored);
      dirty.current = !!value && draft?.id === value.id;
      try {
        writeOffline("active-session", value);
        if (!value) writeOffline("active-draft", null);
      } catch {}
      setError("");
      if (restored && dirty.current) void save(restored).catch(() => {});
    } catch (cause) {
      const restored = !(cause instanceof ApiError)
        ? readOffline<TrainingSession>("active-draft") ||
          readOffline<TrainingSession>("active-session")
        : null;
      if (restored) {
        latest.current = restored;
        setSession(restored);
        dirty.current = !!readOffline("active-draft");
      }
      setError(
        restored
          ? "You’re training offline. Your draft stays on this device; reconnect to save and finish."
          : cause instanceof Error
            ? cause.message
            : "Unable to load your workout.",
      );
    } finally {
      setLoading(false);
    }
  }, [save]);
  useEffect(() => {
    void reload();
  }, [reload]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    const reconnect = () => {
      if (dirty.current && latest.current)
        void save(latest.current).catch(() => {});
    };
    window.addEventListener("online", reconnect);
    return () => {
      window.removeEventListener("beforeunload", warn);
      window.removeEventListener("online", reconnect);
      clearTimeout(timer.current);
      if (dirty.current && latest.current)
        void save(latest.current).catch(() => {});
    };
  }, [save]);
  function change(next: TrainingSession) {
    latest.current = next;
    setSession(next);
    try {
      writeOffline("active-draft", next);
    } catch {
      setError(
        "Device storage is unavailable. Stay on this page until your workout saves online.",
      );
    }
    dirty.current = true;
    setSaving(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void save(next).catch(() => {});
    }, 600);
  }
  async function flush() {
    clearTimeout(timer.current);
    if (latest.current) await save(latest.current);
  }
  async function discard() {
    clearTimeout(timer.current);
    await queue.current.catch(() => {});
    if (latest.current)
      await api(`/training-session/${latest.current.id}`, "DELETE");
    dirty.current = false;
    try {
      writeOffline("active-session", null);
      writeOffline("active-draft", null);
    } catch {}
    latest.current = null;
    setSession(null);
  }
  function completed() {
    dirty.current = false;
    try {
      writeOffline("active-session", null);
      writeOffline("active-draft", null);
    } catch {}
    latest.current = null;
    setSession(null);
  }
  return {
    session,
    loading,
    error,
    saving,
    change,
    flush,
    discard,
    completed,
    reload,
  };
}
