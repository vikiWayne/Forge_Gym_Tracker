import { SecuritySettings } from "../security/SecuritySettings";
import { UsernameSettings } from "./UsernameSettings";
import { type FormEvent, useState } from "react";
import { Check, ShieldCheck, Palette, LogOut, Sun, Moon } from "lucide-react";
import { useTheme } from "../../app/providers/ThemeProvider";
import { useAuth } from "../../app/providers/AuthProvider";
import { api } from "../../shared/api/client";
import type { User } from "../../shared/api/types";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { PageHeader } from "../../shared/ui/PageHeader";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { ProfileFields } from "./ProfileFields";
export function ProfilePage() {
  const { theme, toggle } = useTheme();
  const { user, authenticate, logout } = useAuth();
  const { pending, error, run } = useAsyncAction();
  const [saved, setSaved] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setSaved(false);
    void run(async () => {
      authenticate(
        await api<User>("/me", "PUT", {
          age: Number(fields.get("age")),
          weight: Number(fields.get("weight")),
          sex: fields.get("sex"),
        }),
      );
      setSaved(true);
    });
  }
  return (
    <>
      <PageHeader
        eyebrow="ALL ABOUT YOU"
        title="Your space."
        description="Your details, preferences and account security."
        action={
          <button
            className="button secondary"
            disabled={pending}
            onClick={() => void run(logout, { feedback: false })}
          >
            <LogOut size={17} />
            Sign out
          </button>
        }
      />
      <div className="profile-settings-grid">
        <div className="profile-settings-column">
          <section className="panel profile-details-card">
            <div className="profile-heading">
              <span className="profile-avatar">
                {user?.username.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <h2>{user?.username}</h2>
                <p>{user?.email}</p>
                <p>
                  Your email stays private. Partners see your public handle.
                </p>
              </div>
            </div>
            <form onSubmit={submit}>
              <ErrorMessage message={error} />
              <ProfileFields user={user} />
              {saved && (
                <p className="success-message" role="status">
                  Your profile is up to date.
                </p>
              )}
              <button className="button primary" disabled={pending}>
                <Check size={17} />
                {pending ? "Saving…" : "Save your details"}
              </button>
            </form>
          </section>
          <UsernameSettings />
        </div>
        <div className="profile-settings-column">
          <section className="panel profile-appearance-card">
            <span className="panel-icon">
              <Palette size={23} />
            </span>
            <h2>Appearance</h2>
            <p>Fresh daylight or a quieter night mode.</p>
            <div
              className="appearance-choices"
              role="group"
              aria-label="Appearance"
            >
              <button
                type="button"
                aria-pressed={theme === "light"}
                onClick={() => {
                  if (theme !== "light") toggle();
                }}
              >
                <Sun size={18} />
                Light
              </button>
              <button
                type="button"
                aria-pressed={theme === "dark"}
                onClick={() => {
                  if (theme !== "dark") toggle();
                }}
              >
                <Moon size={18} />
                Dark
              </button>
            </div>
          </section>
          <SecuritySettings />
          <section className="privacy-card profile-privacy-card">
            <ShieldCheck size={27} />
            <h2>Your progress belongs to you.</h2>
            <p>
              Your workouts stay private until you choose to share them in
              Together. You control workouts and notes separately.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
