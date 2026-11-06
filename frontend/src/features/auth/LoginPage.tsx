import { PasswordField } from "./PasswordField";
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { api } from "../../shared/api/client";
import type { User } from "../../shared/api/types";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { Brand } from "../../shared/ui/Brand";
import { ThemeToggle } from "../../shared/ui/ThemeToggle";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { GymArt } from "../../shared/ui/GymArt";
import { ProfileFields } from "../profile/ProfileFields";

export function LoginPage() {
  const { user, authenticate } = useAuth();
  const location = useLocation();
  const [register, setRegister] = useState(false);
  const { pending, error, run, clearError } = useAsyncAction();
  const requestedPath = (location.state as { from?: string } | null)?.from;
  const destination =
    requestedPath?.startsWith("/") &&
    !requestedPath.startsWith("//") &&
    requestedPath !== "/login"
      ? requestedPath
      : "/dashboard";
  if (user) return <Navigate to={destination} replace />;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    void run(async () => {
      const account = await api<User>(
        `/auth/${register ? "register" : "login"}`,
        "POST",
        {
          username: fields.get("username"),
          password: fields.get("password"),
          ...(register
            ? {
                age: Number(fields.get("age")),
                weight: Number(fields.get("weight")),
                sex: fields.get("sex"),
              }
            : {}),
        },
      );
      authenticate(account);
    });
  }
  return (
    <div className="auth-page">
      <header className="auth-header">
        <Brand />
        <ThemeToggle />
      </header>
      <main className="auth-grid" id="main">
        <section className="auth-story" aria-label="Welcome to Forge">
          <div className="story-top">
            <span className="story-label">
              <Sparkles size={14} /> YOUR NEXT CHAPTER STARTS HERE
            </span>
            <span className="story-arrow">
              <ArrowUpRight size={27} />
            </span>
          </div>
          <h1>
            A little stronger.
            <br />A little <span>more you.</span>
          </h1>
          <p>
            A home for your lifts, your little wins, and the progress you make
            along the way.
          </p>
          <div className="auth-illustration">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <GymArt />
            <span className="floating-label">
              <span className="mini-icon">
                <Check size={15} />
              </span>{" "}
              Every rep is a fresh start.
            </span>
          </div>
          <div className="story-bottom">
            <span>SHOW UP FOR YOURSELF.</span>
            <span>WE’LL KEEP TRACK. ↗</span>
          </div>
        </section>
        <section className="auth-form-panel">
          <div className="auth-form-heading">
            <span className="section-kicker">
              <span className="status-dot" /> MAKE ROOM FOR PROGRESS
            </span>
            <h2>
              {register
                ? "Your origin story starts here."
                : "Back for another rep?"}
            </h2>
            <p>
              {register
                ? "Pick a username, bring your ambition. We’ll spot you."
                : "Your lifts missed you. Let’s pick up where you left off."}
            </p>
          </div>
          <div className="auth-tabs" aria-label="Account action">
            <button
              type="button"
              aria-pressed={!register}
              className={!register ? "active" : ""}
              onClick={() => {
                setRegister(false);
                clearError();
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              aria-pressed={register}
              className={register ? "active" : ""}
              onClick={() => {
                setRegister(true);
                clearError();
              }}
            >
              Create account
            </button>
          </div>
          <form onSubmit={submit} key={String(register)}>
            <ErrorMessage message={error} />
            <label>
              Username
              <input
                name="username"
                autoComplete="username"
                placeholder={
                  register
                    ? "Your future gym legend name"
                    : "Your training alter ego"
                }
                required
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9_]+"
                title="Use 3–30 letters, numbers or underscores"
              />
            </label>
            <PasswordField register={register} key={String(register)} />
            {register && <ProfileFields />}
            <button
              type="submit"
              className="button primary full-width"
              disabled={pending}
            >
              {pending
                ? "One moment…"
                : register
                  ? "Let’s build my legend"
                  : "I’m ready. Let’s lift."}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="auth-privacy">
            <LockKeyhole size={14} />
            Your progress is yours. Sharing is always your choice.
          </p>
          <div className="auth-footnote">
            <span className="small-flower">✳</span>
            <p>
              No perfect routines required.
              <br />
              <strong>Just you, showing up.</strong>
            </p>
          </div>
        </section>
      </main>
      <footer className="auth-footer">
        <span>FORGE · BUILT FOR THE LONG GAME</span>
        <span>One rep at a time.</span>
      </footer>
    </div>
  );
}
