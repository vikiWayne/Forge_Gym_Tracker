import { useState, type FormEvent } from "react";
import { AtSign, Check, ChevronDown } from "lucide-react";
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
      : "This is your current public handle.",
    taken: "That handle is taken. Try a different one.",
    error: "We couldn’t check right now. Please try again shortly.",
  }[status];
  return (
    <details className="panel username-settings public-handle-settings">
      <summary>
        <AtSign size={22} />
        <div>
          <strong>Public handle</strong>
          <span>{user?.username}</span>
        </div>
        <ChevronDown size={18} />
      </summary>
      <form onSubmit={submit}>
        <label>
          Public handle
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
          Use this public handle for invitations. Sign in with your email. Your
          workouts and shared plans stay with your account.
        </p>
        <ErrorMessage message={error} />
        {saved && (
          <p className="success-message" role="status">
            Public handle updated. Your new chapter has a name.
          </p>
        )}
        <button
          className="button primary"
          disabled={pending || !changed || status !== "available"}
        >
          <Check size={16} />
          {pending ? "Saving…" : "Update public handle"}
        </button>
      </form>
    </details>
  );
}
