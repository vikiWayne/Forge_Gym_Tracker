import { useState } from "react";
import { Plus, Users, ArrowUpRight } from "lucide-react";
import { useTraining } from "../../app/providers/TrainingProvider";
import { PageHeader } from "../../shared/ui/PageHeader";
import { EmptyState } from "../../shared/ui/Feedback";
import { Modal } from "../../shared/ui/Modal";
import { PlanForm } from "./PlanForm";
import { PlanCard } from "./PlanCard";
export function PlansPage() {
  const { plans } = useTraining();
  const [adding, setAdding] = useState(false);
  return (
    <>
      <PageHeader
        eyebrow="GOOD COMPANY. GREAT PROGRESS."
        title="Better, together."
        description="Different starting points. One stronger team."
        action={
          <button className="button primary" onClick={() => setAdding(true)}>
            <Plus size={17} />
            Create shared plan
          </button>
        }
      />
      <section className="together-banner">
        <span className="together-art">
          <Users size={62} />
          <span>✳</span>
        </span>
        <div>
          <span className="section-kicker">CHEER EACH OTHER ON</span>
          <h2>
            Bring a little company
            <br />
            to your next personal best.
          </h2>
          <p>
            Create a plan, invite a friend, and track the same movements.
            <br />
            You choose who gets a seat in your corner.
          </p>
        </div>
        <ArrowUpRight size={40} />
      </section>
      {plans.length ? (
        <div className="plans-list">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      ) : (
        <EmptyState title="Your crew has room to grow.">
          Create a shared plan above, or ask a friend to invite your username.
          No shared plans yet.
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
