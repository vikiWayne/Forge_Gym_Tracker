import { useState, type FormEvent } from "react";
import { ArrowLeft, KeyRound, Check } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { api } from "../../shared/api/client";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { Brand } from "../../shared/ui/Brand";
import { ThemeToggle } from "../../shared/ui/ThemeToggle";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { PasswordInput } from "../../shared/ui/PasswordInput";
export function ForgotPasswordPage() {
  const { user } = useAuth();
  const { pending, error, run } = useAsyncAction();
  const [done, setDone] = useState(false);
  if (user) return <Navigate to="/profile" replace />;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    void run(async () => {
      if (data.get("new_password") !== data.get("confirm_password"))
        throw new Error("Your new passwords do not match.");
      await api("/auth/reset-password", "POST", {
        email: data.get("email"),
        recovery_code: data.get("recovery_code"),
        new_password: data.get("new_password"),
      });
      form.reset();
      setDone(true);
    });
  }
  return (
    <div className="auth-page">
      <header className="auth-header">
        <Brand />
        <ThemeToggle />
      </header>
      <main className="reset-password-page" id="main">
        <Link className="back-link" to="/login">
          <ArrowLeft size={16} />
          Back to sign in
        </Link>
        <section className="panel">
          <span className="panel-icon">
            {done ? <Check size={27} /> : <KeyRound size={27} />}
          </span>
          <h1>
            {done ? "Fresh password. Fresh start." : "Let’s get you back in."}
          </h1>
          {done ? (
            <>
              <p>
                Your password has been reset and all previous sessions are
                signed out. This recovery code is now used. Generate a new one
                after you sign in.
              </p>
              <Link className="button primary full-width" to="/login">
                Sign in with my new password
              </Link>
            </>
          ) : (
            <>
              <p>
                Use your email and the recovery code you saved during setup or
                in Profile → Account security.
              </p>
              <form onSubmit={submit}>
                <label>
                  Email address
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    minLength={3}
                    maxLength={254}
                    pattern="[a-zA-Z0-9_]+"
                    required
                  />
                </label>
                <label>
                  Recovery code
                  <input
                    name="recovery_code"
                    autoComplete="off"
                    spellCheck={false}
                    minLength={8}
                    maxLength={128}
                    placeholder="FORGE-…"
                    required
                  />
                </label>
                <PasswordInput
                  name="new_password"
                  label="New password"
                  autoComplete="new-password"
                />
                <PasswordInput
                  name="confirm_password"
                  label="Confirm new password"
                  autoComplete="new-password"
                />
                <ErrorMessage message={error} />
                <button
                  className="button primary full-width"
                  disabled={pending}
                >
                  {pending ? "Resetting…" : "Reset my password"}
                </button>
              </form>
              <p className="recovery-warning">
                No saved recovery code? For your account’s safety, it cannot be
                reset here. If you’re still signed in on another device,
                generate a code in Profile → Account security first.
              </p>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
