import { ArrowUpRight, Award, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useTraining } from "../../app/providers/TrainingProvider";
import { localDate } from "../../shared/lib/dates";
import { journeyProgress } from "./journey";
export function JourneyCard() {
  const { logs } = useTraining();
  const journey = journeyProgress(logs, localDate());
  const next = journey.milestones.find((item) => !item.earned);
  return (
    <section className="journey-hero" aria-labelledby="journey-heading">
      <div className="journey-hero-top">
        <span className="journey-eyebrow">
          <Sparkles size={14} /> YOUR LONG GAME
        </span>
        <Link to="/progress" aria-label="View your progress and milestones">
          <ArrowUpRight size={20} />
        </Link>
      </div>
      <div className="journey-main">
        <div className="level-medallion" aria-label={`Level ${journey.level}`}>
          <span>LEVEL</span>
          <strong>{journey.level}</strong>
        </div>
        <div>
          <h2 id="journey-heading">
            {journey.workouts
              ? "Look how far you’ve come."
              : "Every journey starts with one rep."}
          </h2>
          <p>
            {journey.workouts
              ? `${journey.sets} ${journey.sets === 1 ? "set" : "sets"}. ${journey.days} training ${journey.days === 1 ? "day" : "days"}. All your own work.`
              : "Save a workout to start building your training XP."}
          </p>
        </div>
      </div>
      <div className="journey-xp-label">
        <strong>{journey.xp.toLocaleString()} XP</strong>
        <span>
          {journey.remaining} to level {journey.level + 1}
        </span>
      </div>
      <progress
        className="journey-progress"
        value={journey.progress}
        max={250}
        aria-label={`${journey.progress} of 250 XP toward level ${journey.level + 1}`}
      />
      <div className="journey-next">
        <Award size={17} />
        <span>
          {next ? (
            <>
              Next milestone: <strong>{next.title}</strong>
            </>
          ) : (
            "Every milestone earned. Keep making it yours."
          )}
        </span>
        <details>
          <summary aria-label="How training XP works">How XP works</summary>
          <p>
            10 XP per saved set + 25 XP per distinct training day. Every 250 XP
            unlocks a level. Device-only drafts count after syncing. Editing or
            removing workouts updates XP. No rankings, deadlines or penalties
            for rest days.
          </p>
        </details>
      </div>
    </section>
  );
}
export function Milestones() {
  const { logs } = useTraining();
  const { milestones } = journeyProgress(logs, localDate());
  return (
    <details className="panel milestone-panel">
      <summary>
        <span>
          <Award size={20} />
          Your milestones
        </span>
        <strong>
          {milestones.filter((item) => item.earned).length}/{milestones.length}
        </strong>
      </summary>
      <div className="milestone-grid">
        {milestones.map((item) => (
          <article
            className={item.earned ? "milestone earned" : "milestone"}
            key={item.id}
          >
            <span className="milestone-icon">
              <Award size={22} />
            </span>
            <div>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
              <span className="milestone-status">
                {item.earned
                  ? "Unlocked"
                  : `${Math.min(item.value, item.target)}/${item.target}`}
              </span>
            </div>
          </article>
        ))}
      </div>
      <p className="field-hint">
        Milestones celebrate your saved training history. Rest days are part of
        the journey.
      </p>
    </details>
  );
}
