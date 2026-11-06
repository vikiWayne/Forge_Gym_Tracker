import { Link, Navigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { Plus, Users, ArrowRight, Search } from "lucide-react";
import { useTraining } from "../../app/providers/TrainingProvider";
import { PageHeader } from "../../shared/ui/PageHeader";
import {
  EmptyState,
  ErrorMessage,
  LoadingState,
} from "../../shared/ui/Feedback";
import { Modal } from "../../shared/ui/Modal";
import { PlanForm } from "./PlanForm";

export function PlansPage() {
  const { plans, loading, error } = useTraining();
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const { hash } = useLocation();
  if (hash.startsWith("#plan-")) {
    return (
      <Navigate to={`/together/${encodeURIComponent(hash.slice(6))}`} replace />
    );
  }
  const query = search.trim().toLocaleLowerCase();
  const matches = plans
    .filter((plan) =>
      [
        plan.name,
        plan.owner_name,
        ...plan.members.map((member) => member.username),
      ].some((value) => value.toLocaleLowerCase().includes(query)),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <PageHeader
        eyebrow="GOOD COMPANY. GREAT PROGRESS."
        title="Better, together."
        description="Choose a plan to see your team’s workouts and compare progress."
        action={
          <button className="button primary" onClick={() => setAdding(true)}>
            <Plus size={17} />
            Create shared plan
          </button>
        }
      />
      <section className="panel plan-search-panel">
        <label htmlFor="plan-search">
          <Search size={18} /> Search plans
        </label>
        <input
          id="plan-search"
          type="search"
          value={search}
          placeholder="Plan name or partner username"
          onChange={(event) => setSearch(event.target.value)}
        />
        <p role="status">
          {matches.length} {matches.length === 1 ? "plan" : "plans"} found
        </p>
      </section>
      <ErrorMessage message={error} />
      {loading ? (
        <LoadingState />
      ) : matches.length ? (
        <div className="plan-preview-grid">
          {matches.map((plan) => (
            <Link
              className="panel plan-preview"
              key={plan.id}
              to={`/together/${plan.id}`}
            >
              <span className="plan-icon">
                <Users size={23} />
              </span>
              <span className="plan-preview-copy">
                <span className="section-kicker">
                  {plan.accepted ? "YOUR SHARED PLAN" : "INVITATION FOR YOU"}
                </span>
                <h2>{plan.name}</h2>
                <p>
                  {plan.accepted
                    ? plan.members.map((member) => member.username).join(" + ")
                    : `Invited by ${plan.owner_name}`}
                </p>
                <span>
                  {plan.accepted
                    ? `${plan.logs.length} workout logs · ${plan.members.length} members`
                    : "Review invitation and sharing details"}
                </span>
              </span>
              <ArrowRight size={21} aria-hidden="true" />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            query
              ? "No plans match your search."
              : "Your crew has room to grow."
          }
        >
          {query
            ? "Try another plan name or partner username."
            : "Create a plan above or ask a friend to invite you."}
        </EmptyState>
      )}
      {adding && (
        <Modal
          title="Make a little room for your crew"
          close={() => setAdding(false)}
        >
          <PlanForm onSaved={() => setAdding(false)} />
        </Modal>
      )}
    </>
  );
}
