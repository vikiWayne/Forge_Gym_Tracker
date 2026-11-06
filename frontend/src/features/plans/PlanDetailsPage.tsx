import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTraining } from "../../app/providers/TrainingProvider";
import {
  EmptyState,
  ErrorMessage,
  LoadingState,
} from "../../shared/ui/Feedback";
import { PlanCard } from "./PlanCard";

export function PlanDetailsPage() {
  const { id } = useParams();
  const { plans, loading, error } = useTraining();
  const plan = plans.find((item) => item.id === id);
  return (
    <>
      <Link className="text-link plan-back" to="/together">
        <ArrowLeft size={18} />
        All plans
      </Link>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : plan ? (
        <PlanCard key={plan.id} plan={plan} />
      ) : (
        <EmptyState
          title="This plan is no longer available."
          to="/together"
          action="Back to plans"
        >
          You may have left this plan or declined its invitation.
        </EmptyState>
      )}
    </>
  );
}
