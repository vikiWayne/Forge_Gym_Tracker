import { SecuritySettings } from "../security/SecuritySettings";
import { UsernameSettings } from "./UsernameSettings";
import { type FormEvent, useState } from "react";
import { Check, ShieldCheck, Palette, LogOut } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { api } from "../../shared/api/client";
import type { User } from "../../shared/api/types";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { PageHeader } from "../../shared/ui/PageHeader";
import { ThemeToggle } from "../../shared/ui/ThemeToggle";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { ProfileFields } from "./ProfileFields";
export function ProfilePage() {
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
        title="Make yourself at home."
        description="Your details, your preferences, your little corner of strong."
        action={
          <button
            className="button secondary"
            disabled={pending}
            onClick={() => void run(logout)}
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
                <p>Your personal training profile</p>
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
          <section className="panel profile-appearance-card">
            <span className="panel-icon">
              <Palette size={23} />
            </span>
            <h2>A space that feels like you.</h2>
            <p>
              Bright mornings or late-night sessions. Choose your favorite look.
            </p>
            <ThemeToggle />
          </section>
        </div>
        <div className="profile-settings-column">
          <SecuritySettings />
          <section className="privacy-card profile-privacy-card">
            <ShieldCheck size={27} />
            <h2>Your progress belongs to you.</h2>
            <p>
              Your workouts stay private unless you join a shared plan. Leave a
              plan anytime to stop sharing.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
