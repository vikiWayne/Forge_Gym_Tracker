import { useEffect, useState } from "react";
import { ArrowUpRight, Check, Dumbbell, Heart, Utensils } from "lucide-react";
import { Link } from "react-router-dom";
import { useTraining } from "../../app/providers/TrainingProvider";
import { api } from "../../shared/api/client";
import type { TrainingSession } from "../../shared/api/types";
import { localDate } from "../../shared/lib/dates";
export function DailyQuests() {
  const { logs, exercises } = useTraining();
  const [today, setToday] = useState(localDate());
  const [status, setStatus] = useState<{
    protein: boolean | null;
    recovery: boolean | null;
    active: TrainingSession | null;
  }>({ protein: null, recovery: null, active: null });
  useEffect(() => {
    const timer = setInterval(() => setToday(localDate()), 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void Promise.allSettled([
      api<{ entries: { date: string }[] }>(
        "/protein",
        "GET",
        undefined,
        controller.signal,
      ),
      api<{ entries: { date: string }[] }>(
        "/recovery",
        "GET",
        undefined,
        controller.signal,
      ),
      api<TrainingSession | null>(
        "/training-session",
        "GET",
        undefined,
        controller.signal,
      ),
    ]).then(([protein, recovery, active]) => {
      if (!controller.signal.aborted)
        setStatus({
          protein:
            protein.status === "fulfilled"
              ? protein.value.entries.some((item) => item.date === today)
              : null,
          recovery:
            recovery.status === "fulfilled"
              ? recovery.value.entries.some((item) => item.date === today)
              : null,
          active: active.status === "fulfilled" ? active.value : null,
        });
    });
    return () => controller.abort();
  }, [today]);
  const trained = logs.some((log) => !log.pending_sync && log.date === today);
  const quests = [
    {
      title: status.active
        ? "Resume your workout"
        : exercises.length
          ? "Make a little movement"
          : "Add your first exercise",
      description: status.active
        ? status.active.name
        : "Log a workout, your way.",
      to: status.active
        ? "/workouts/active"
        : exercises.length
          ? "/workouts/new"
          : "/exercises",
      complete: trained && !status.active,
      icon: Dumbbell,
      tone: "move",
    },
    {
      title: "Fuel your day",
      description: "Add a protein entry.",
      to: "/protein",
      complete: status.protein,
      icon: Utensils,
      tone: "fuel",
    },
    {
      title: "Check in with yourself",
      description: "Sleep, energy, how you feel.",
      to: "/recovery",
      complete: status.recovery,
      icon: Heart,
      tone: "recover",
    },
  ];
  const completed = quests.filter((item) => item.complete).length;
  return (
    <section className="daily-quests" aria-labelledby="quests-heading">
      <div className="section-head">
        <div>
          <h2 id="quests-heading">Today’s small wins</h2>
          <p>Pick what fits your day. Recovery counts, too.</p>
        </div>
        <span className="quest-count">{completed}/3</span>
      </div>
      <div className="quest-grid">
        {quests.map(
          ({ title, description, to, complete, icon: Icon, tone }) => (
            <Link
              className={`quest-card quest-${tone} ${complete ? "quest-complete" : ""}`}
              to={to}
              key={tone}
            >
              <span className="quest-icon">
                <Icon size={22} />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{complete ? "Done for today. Nice work." : description}</p>
              </div>
              <span
                className="quest-state"
                aria-label={complete ? "Completed" : "Open"}
              >
                {complete ? <Check size={17} /> : <ArrowUpRight size={17} />}
              </span>
            </Link>
          ),
        )}
      </div>
    </section>
  );
}
