import { Clock3, Mail } from "lucide-react";
import type { Plan } from "../../shared/api/types";
export function InvitationStatus({ plan }: { plan: Plan }) {
  if (!plan.accepted)
    return (
      <div className="invitation-label">
        <Mail size={14} />
        Invitation from {plan.owner_name} · awaiting your response
      </div>
    );
  if (!plan.pending_invites.length) return null;
  return (
    <div className="outgoing-invitations">
      <h3>
        <Clock3 size={15} />
        Awaiting a response
      </h3>
      <ul>
        {plan.pending_invites.map((person) => (
          <li key={person.id}>
            <span>{person.username}</span>
            <span className="pending-invite-tag">Invitation pending</span>
          </li>
        ))}
      </ul>
      <p>
        Your partner will see a notification in their FORGE app. Their logs stay
        private until they accept and choose what to share.
      </p>
    </div>
  );
}
