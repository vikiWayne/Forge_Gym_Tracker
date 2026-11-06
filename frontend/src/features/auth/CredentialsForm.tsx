import { Link } from "react-router-dom";
import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { api } from "../../shared/api/client";
import type { User } from "../../shared/api/types";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { useUsernameAvailability } from "../../shared/hooks/useUsernameAvailability";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { PasswordField } from "./PasswordField";
type ContinueResult =
  | { status: "authenticated"; user: User }
  | { status: "onboarding"; username: string };
export function CredentialsForm({
  onSetup,
}: {
  onSetup: (username: string) => void;
}) {
  const [username, setUsername] = useState("");
  const status = useUsernameAvailability(username);
  const { authenticate } = useAuth();
  const { pending, error, run } = useAsyncAction();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    void run(async () => {
      const result = await api<ContinueResult>("/auth/continue", "POST", {
        username,
        password: fields.get("password"),
      });
      if (result.status === "authenticated") authenticate(result.user);
      else onSetup(result.username);
    });
  }
  const message = {
    idle: "One door for new faces and familiar lifters.",
    invalid: "Use 3–30 letters, numbers or underscores.",
    checking: "Finding your place in the crew…",
    available:
      "This username is available. Continue to set up your new account.",
    taken: "Welcome back! Enter this account’s password to sign in.",
    error: "Availability is taking a breather. You can still continue.",
  }[status];
  return (
    <>
      <div className="auth-form-heading">
        <span className="section-kicker">
          <span className="status-dot" />
          YOUR NEXT REP STARTS HERE
        </span>
        <h2>New here? Back for more?</h2>
        <p>
          Same starting line. Enter your username and password — we’ll take it
          from there.
        </p>
      </div>
      <form onSubmit={submit} className="unified-auth-form">
        <ErrorMessage message={error} />
        <label>
          Username
          <input
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Your training alter ego"
            minLength={3}
            maxLength={30}
            pattern="[a-zA-Z0-9_]+"
            aria-describedby="auth-username-status"
            required
          />
        </label>
        <p
          id="auth-username-status"
          role="status"
          className={`username-status status-${status}`}
        >
          {message}
        </p>
        <PasswordField register={status === "available"} />
        <Link to="/forgot-password" className="text-link forgot-password-link">
          Forgot password?
        </Link>
        <p className="auth-account-explainer">
          Existing username? We’ll sign you in with its password. New username?
          We’ll create your account after a quick profile setup.
        </p>
        <button className="button primary full-width" disabled={pending}>
          {pending
            ? "Finding your next step…"
            : "Let’s go, future stronger you"}
          <ArrowRight size={18} />
        </button>
      </form>
    </>
  );
}
