import { useState } from "react";
import { useTraining } from "../../app/providers/TrainingProvider";
import { PageHeader } from "../../shared/ui/PageHeader";
import { EmptyState } from "../../shared/ui/Feedback";
import { ProgressionCard } from "./ProgressionCard";
import "./overload.css";

export function OverloadPage() {
  const { exercises, logs } = useTraining();
  const [increment, setIncrement] = useState("2.5");
  const [search, setSearch] = useState("");
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const matches = exercises.filter((exercise) =>
    exercise.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  return (
    <>
      <PageHeader
        eyebrow="SMALL STEPS, SAVED EVIDENCE"
        title="Find your next progression."
        description="Review what your recent sets suggest. You choose whether and when to change a weight."
      />
      <section className="panel progression-settings">
        <div>
          <h2>Your next step</h2>
          <p>
            Suggestions check every set on your two most recent training dates.
            They never change a routine or workout automatically.
          </p>
        </div>
        <label>
          Weight increment
          <select
            value={increment}
            onChange={(event) => setIncrement(event.target.value)}
          >
            {[0.5, 1, 1.25, 2.5, 5].map((step) => (
              <option key={step} value={step}>
                {step} kg
              </option>
            ))}
          </select>
        </label>
        <label>
          Find an exercise
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Exercise name"
          />
        </label>
      </section>
      {matches.length ? (
        <div className="progression-grid">
          {matches.map((exercise) => (
            <ProgressionCard
              key={exercise.id}
              exercise={exercise}
              logs={logs}
              today={today}
              increment={Number(increment)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            exercises.length
              ? "No matching movements."
              : "Start with a movement you enjoy."
          }
          to={exercises.length ? undefined : "/exercises"}
          action="Add an exercise"
        >
          {exercises.length
            ? "Try another exercise name."
            : "Create an exercise and log two training dates to build your first suggestion."}
        </EmptyState>
      )}
      <p className="progression-footnote">
        Two logs on the same date count as one training date. Pending offline
        logs and future dates are excluded. Missing RPE/RIR is treated as
        unknown, not as an easy set. Readiness is your own marker and does not
        override the evidence.
      </p>
    </>
  );
}
