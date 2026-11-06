import { useState, type FormEvent } from "react";
import { AtSign, Check } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { api } from "../../shared/api/client";
import type { User } from "../../shared/api/types";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { useUsernameAvailability } from "../../shared/hooks/useUsernameAvailability";
import { ErrorMessage } from "../../shared/ui/Feedback";
export function UsernameSettings() {
  const { user, authenticate } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [saved, setSaved] = useState(false);
  const { pending, error, run } = useAsyncAction();
  const status = useUsernameAvailability(username, user?.username);
  const changed = username.trim() !== user?.username;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    void run(async () => {
      const updated = await api<User>("/me/username", "PUT", { username });
      authenticate(updated);
      setUsername(updated.username);
      setSaved(true);
    });
  }
  const message = {
    idle: "Use 3–30 letters, numbers or underscores.",
    invalid: "Use 3–30 letters, numbers or underscores.",
    checking: "Checking availability…",
    available: changed
      ? "That name is available. Make it yours."
      : "This is your current username.",
    taken: "That username is taken. Try a different one.",
    error: "We couldn’t check right now. Please try again shortly.",
  }[status];
  return (
    <section className="panel username-settings">
      <div className="section-head">
        <div>
          <span className="section-kicker">YOUR TRAINING IDENTITY</span>
          <h2>A name that feels like you.</h2>
        </div>
        <AtSign size={22} />
      </div>
      <form onSubmit={submit}>
        <label>
          Username
          <input
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              setSaved(false);
            }}
            minLength={3}
            maxLength={30}
            pattern="[a-zA-Z0-9_]+"
            aria-describedby="username-status"
            aria-invalid={status === "invalid" || status === "taken"}
            required
          />
        </label>
        <p
          id="username-status"
          role="status"
          className={`username-status status-${status}`}
        >
          {message}
        </p>
        <p className="field-hint">
          Use your new username for future sign-ins and invitations. Your
          workouts and shared plans stay with your account.
        </p>
        <ErrorMessage message={error} />
        {saved && (
          <p className="success-message" role="status">
            Username updated. Your new chapter has a name.
          </p>
        )}
        <button
          className="button primary"
          disabled={pending || !changed || status !== "available"}
        >
          <Check size={16} />
          {pending ? "Saving…" : "Update username"}
        </button>
      </form>
    </section>
  );
}
