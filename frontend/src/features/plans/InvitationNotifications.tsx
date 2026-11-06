import { useEffect, useRef, useState } from "react";
import { Bell, ArrowRight, Mail, RefreshCw } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTraining } from "../../app/providers/TrainingProvider";
export function InvitationNotifications() {
  const { plans, invitationError, refreshInvitations } = useTraining();
  const invitations = plans.filter((plan) => !plan.accepted);
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", keyboard);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", keyboard);
    };
  }, [open]);
  async function check() {
    setChecking(true);
    try {
      await refreshInvitations();
    } catch {
      /* Message is supplied by the provider. */
    } finally {
      setChecking(false);
    }
  }
  return (
    <div className="invitation-notifications" ref={root}>
      <button
        ref={button}
        type="button"
        className="icon-button notification-bell"
        aria-label={`Invitations: ${invitations.length} pending${invitationError ? ", refresh unavailable" : ""}`}
        aria-expanded={open}
        aria-controls="invitation-panel"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) void check();
        }}
      >
        <Bell size={19} />
        {invitations.length > 0 && (
          <span className="notification-count" aria-hidden="true">
            {invitations.length > 99 ? "99+" : invitations.length}
          </span>
        )}
        {invitationError && (
          <span className="notification-warning" aria-hidden="true">
            !
          </span>
        )}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {invitations.length
          ? `${invitations.length} pending training invitation${invitations.length === 1 ? "" : "s"}. Open notifications or Together to respond.`
          : ""}
      </span>
      {open && (
        <section
          id="invitation-panel"
          className="invitation-popover"
          aria-label="Training invitations"
        >
          <div className="section-head">
            <h2>Your invitations</h2>
            <button
              className="icon-button"
              aria-label="Refresh invitations"
              disabled={checking}
              onClick={() => void check()}
            >
              <RefreshCw size={15} className={checking ? "spin" : ""} />
            </button>
          </div>
          {invitationError && (
            <p role="alert" className="error-message">
              {invitationError}
            </p>
          )}
          {invitations.length ? (
            <ul>
              {invitations.map((plan) => (
                <li key={plan.id}>
                  <span className="invitation-mail">
                    <Mail size={17} />
                  </span>
                  <div>
                    <strong>{plan.owner_name}</strong>
                    <p>
                      invited you to <strong>{plan.name}</strong>
                    </p>
                    <Link
                      to={`/together/${plan.id}`}
                      onClick={() => setOpen(false)}
                    >
                      Review invitation
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="invitation-empty">
              You’re all caught up. New training invitations will appear here.
            </p>
          )}
          <p className="invitation-refresh-note">
            Updates every 30 seconds while the app is visible.
          </p>
        </section>
      )}
    </div>
  );
}
