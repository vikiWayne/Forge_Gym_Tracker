import { Link } from "react-router-dom";
import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { api } from "../../shared/api/client";
import type { User } from "../../shared/api/types";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { PasswordField } from "./PasswordField";
type ContinueResult =
  | { status: "authenticated"; user: User }
  | { status: "onboarding"; email: string };
export function CredentialsForm({
  onSetup,
}: {
  onSetup: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  const { authenticate } = useAuth();
  const { pending, error, run } = useAsyncAction();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    void run(async () => {
      const result = await api<ContinueResult>("/auth/continue", "POST", {
        email,
        password: fields.get("password"),
      });
      if (result.status === "authenticated") authenticate(result.user);
      else onSetup(result.email);
    });
  }
  return (
    <>
      <div className="auth-form-heading">
        <span className="section-kicker">
          <span className="status-dot" />
          YOUR NEXT REP STARTS HERE
        </span>
        <h2>New here? Back for more?</h2>
        <p>
          Enter your email and password to sign in or create your training
          space.
        </p>
      </div>
      <form onSubmit={submit} className="unified-auth-form">
        <ErrorMessage message={error} />
        <label>
          Email address
          <input
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            maxLength={254}
            required
          />
        </label>
        <PasswordField register={false} />
        <Link to="/forgot-password" className="text-link forgot-password-link">
          Forgot password?
        </Link>
        <p className="auth-account-explainer">
          Existing email? Sign in with its password. New email? Complete a quick
          profile setup. Your email stays private; your public handle is used
          for sharing.
        </p>
        <button className="button primary full-width" disabled={pending}>
          {pending ? "Finding your next step…" : "Continue"}
          <ArrowRight size={18} />
        </button>
      </form>
    </>
  );
}
