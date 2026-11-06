import { useRef, useState, type FormEvent } from "react";
import { LockKeyhole } from "lucide-react";
import { api } from "../../shared/api/client";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { PasswordInput } from "../../shared/ui/PasswordInput";
export function PasswordChangeForm({ onChanged }: { onChanged: () => void }) {
  const { pending, error, run } = useAsyncAction();
  const [saved, setSaved] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaved(false);
    void run(async () => {
      if (data.get("new_password") !== data.get("confirm_password"))
        throw new Error("Your new passwords do not match.");
      await api("/me/password", "POST", {
        current_password: data.get("current_password"),
        new_password: data.get("new_password"),
      });
      form.current?.reset();
      setSaved(true);
      onChanged();
    });
  }
  return (
    <section className="panel">
      <div className="section-head">
        <h2>Change password</h2>
        <LockKeyhole size={22} />
      </div>
      <p>Use your current password to choose a new one.</p>
      <form ref={form} onSubmit={submit}>
        <PasswordInput name="current_password" label="Current password" />
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
        {saved && (
          <p className="success-message" role="status">
            Password changed. Other sessions are signed out. Generate a new
            recovery code below.
          </p>
        )}
        <button className="button primary" disabled={pending}>
          {pending ? "Updating…" : "Change password"}
        </button>
      </form>
    </section>
  );
}
