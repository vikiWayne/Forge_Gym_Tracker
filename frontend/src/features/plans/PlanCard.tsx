import { InvitationStatus } from "./InvitationStatus";
import { SetSummary } from "../workouts/SetSummary";
import { WorkoutMobileCards } from "../workouts/WorkoutMobileCards";
import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { useTraining } from "../../app/providers/TrainingProvider";
import { api } from "../../shared/api/client";
import type { Plan } from "../../shared/api/types";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { Modal } from "../../shared/ui/Modal";
import { formatDate } from "../../shared/lib/dates";
import { PlanForm } from "./PlanForm";
import { SharedProgressChart } from "./SharedProgressChart";
import { SharedRoutines } from "./SharedRoutines";
import { SharingSettings } from "./SharingSettings";
export function PlanCard({ plan }: { plan: Plan }) {
  const { user } = useAuth();
  const { refresh } = useTraining();
  const { pending, error, run } = useAsyncAction();
  const [dialog, setDialog] = useState<"invite" | "leave" | null>(null);
  const [notice, setNotice] = useState("");
  return (
    <section
      className={`panel plan-card ${!plan.accepted ? "pending-plan-card" : ""}`}
      id={`plan-${plan.id}`}
      tabIndex={-1}
    >
      <div className="section-head">
        <div className="plan-title">
          <span className="plan-icon">
            <Users size={23} />
          </span>
          <div>
            <h2>{plan.name}</h2>
            <p>
              {plan.accepted
                ? plan.members.map((member) => member.username).join(" + ")
                : "You’ve got an invitation. A new training chapter?"}
            </p>
          </div>
        </div>
        <div className="row-actions">
          {plan.accepted ? (
            <>
              {plan.owner_id === user?.id && (
                <button
                  className="button secondary"
                  onClick={() => setDialog("invite")}
                >
                  <Plus size={15} />
                  Invite partner
                </button>
              )}
              <button
                className="button subtle"
                onClick={() => setDialog("leave")}
              >
                Leave plan
              </button>
            </>
          ) : (
            <>
              <button
                className="button secondary"
                disabled={pending}
                onClick={() =>
                  void run(async () => {
                    await api(`/plans/${plan.id}/membership`, "DELETE");
                    await refresh();
                  })
                }
              >
                Decline
              </button>
              <button
                className="button primary"
                disabled={pending}
                onClick={() =>
                  void run(async () => {
                    await api(`/plans/${plan.id}/accept`, "POST");
                    await refresh();
                  })
                }
              >
                Accept invitation
              </button>
            </>
          )}
        </div>
      </div>
      <InvitationStatus plan={plan} />
      <ErrorMessage message={error} />
      {notice && (
        <p className="success-message" role="status">
          {notice}
        </p>
      )}
      {plan.accepted ? (
        <>
          <SharingSettings key={plan.id} plan={plan} />
          <SharedProgressChart plan={plan} />
          <SharedRoutines plan={plan} />
          <WorkoutMobileCards logs={plan.logs} exercises={[]} />
          {plan.logs.length > 0 && (
            <div className="table-scroll shared-workout-desktop">
              <table>
                <caption className="sr-only">Shared workout logs</caption>
                <thead>
                  <tr>
                    <th scope="col">Partner</th>
                    <th scope="col">Movement</th>
                    <th scope="col">Date</th>
                    <th scope="col">Sets · weight × reps</th>
                    <th scope="col">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.logs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.username}</td>
                      <td>{log.name}</td>
                      <td>{formatDate(log.date)}</td>
                      <td>
                        <SetSummary sets={log.sets} />
                      </td>
                      <td className="notes-cell">{log.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <p className="invite-disclosure">
          Accepting joins this plan. Your workouts stay private until you choose
          sharing preferences. Share selected workouts or all workouts, and
          decide whether to include notes. Leave anytime to stop access.
        </p>
      )}
      {dialog && (
        <Modal
          title={
            dialog === "invite"
              ? "A stronger team starts here"
              : "Leave this shared plan?"
          }
          close={() => setDialog(null)}
        >
          {dialog === "invite" ? (
            <PlanForm
              planId={plan.id}
              onSaved={() => {
                setDialog(null);
                setNotice(
                  "Invitation sent. Your partner can accept in Together.",
                );
              }}
            />
          ) : (
            <>
              <p className="modal-description">
                Your personal workouts stay in your journal. Your data will no
                longer be shared with this group, and you’ll lose access to its
                shared progress.
              </p>
              <button
                className="button danger full-width"
                disabled={pending}
                onClick={() =>
                  void run(async () => {
                    await api(`/plans/${plan.id}/membership`, "DELETE");
                    await refresh();
                    setDialog(null);
                  })
                }
              >
                Leave plan
              </button>
            </>
          )}
        </Modal>
      )}
    </section>
  );
}
