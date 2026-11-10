import type { FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { api } from "../../shared/api/client";
import { useTraining } from "../../app/providers/TrainingProvider";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { ErrorMessage } from "../../shared/ui/Feedback";
export function PlanForm({
  planId,
  onSaved,
}: {
  planId?: string;
  onSaved: () => void;
}) {
  const { refresh } = useTraining();
  const { pending, error, run } = useAsyncAction();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    void run(async () => {
      await api(
        planId ? `/plans/${planId}/invite` : "/plans",
        "POST",
        planId
          ? { username: fields.get("username") }
          : { name: fields.get("name") },
      );
      await refresh();
      onSaved();
    });
  }
  return (
    <form onSubmit={submit}>
      <p className="modal-description">
        {planId
          ? "Invite an existing public FORGE handle. They choose whether to join and which workouts to share. Email addresses remain private."
          : "Create a group for your training crew. Your workouts stay private until you choose sharing preferences. Leave anytime to stop access."}
      </p>
      <ErrorMessage message={error} />
      {planId ? (
        <label>
          Partner’s public handle
          <input
            name="username"
            required
            maxLength={30}
            placeholder="Their exact username"
          />
        </label>
      ) : (
        <label>
          Plan name
          <input
            name="name"
            required
            maxLength={80}
            placeholder="Give your crew a name"
          />
        </label>
      )}
      <button className="button primary full-width" disabled={pending}>
        {pending ? "Saving…" : planId ? "Send invitation" : "Create your plan"}
        <ArrowRight size={16} />
      </button>
    </form>
  );
}
