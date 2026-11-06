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
          ? "Invite an existing FORGE username. They’ll choose whether to accept and share their workout logs."
          : "Accepted members share their historical and future workout logs with the group. You can leave anytime to stop sharing."}
      </p>
      <ErrorMessage message={error} />
      {planId ? (
        <label>
          Partner’s username
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
