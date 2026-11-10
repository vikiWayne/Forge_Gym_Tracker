import { Trophy } from "lucide-react";
import type { Log } from "../../shared/api/types";
import { personalRecords } from "./records";
export function PersonalRecords({ logs }: { logs: Log[] }) {
  if (!logs.length) return null;
  const records = personalRecords(logs);
  const number = (value: number) =>
    value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return (
    <section
      className="personal-records"
      aria-label="All-time personal records"
    >
      <h3>
        <Trophy size={17} />
        All-time personal records
      </h3>
      <dl className="record-grid">
        <div>
          <dt>Heaviest set</dt>
          <dd>{number(records.heaviest)} kg</dd>
        </div>
        <div>
          <dt>Most reps in a set</dt>
          <dd>{records.mostReps}</dd>
        </div>
        <div>
          <dt>Estimated 1RM</dt>
          <dd>
            {records.estimatedMax ? `${number(records.estimatedMax)} kg` : "—"}
          </dd>
        </div>
        <div>
          <dt>Highest workout volume</dt>
          <dd>{number(records.volume)} kg</dd>
        </div>
      </dl>
      <details>
        <summary>Weight records by rep count</summary>
        <ul className="rep-records">
          {records.repRecords.map(([reps, weight]) => (
            <li key={reps}>
              {reps} {reps === 1 ? "rep" : "reps"}
              <strong>{number(weight)} kg</strong>
            </li>
          ))}
        </ul>
      </details>
      <p className="field-hint">
        Estimated 1RM uses the Epley formula for sets of 1–10 reps. Volume is
        weight × reps across one exercise log. Records recalculate when logs
        change.
      </p>
    </section>
  );
}
