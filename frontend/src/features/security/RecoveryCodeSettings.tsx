import { useRef, useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { api } from "../../shared/api/client";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { PasswordInput } from "../../shared/ui/PasswordInput";
import { RecoveryCodeDisplay } from "./RecoveryCodeDisplay";
export function RecoveryCodeSettings({
  hasCode,
  onGenerated,
}: {
  hasCode: boolean | null;
  onGenerated: () => void;
}) {
  const { pending, error, run } = useAsyncAction();
  const [code, setCode] = useState("");
  const form = useRef<HTMLFormElement>(null);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void run(async () => {
      const result = await api<{ recovery_code: string }>(
        "/me/recovery-code",
        "POST",
        { current_password: data.get("current_password") },
      );
      form.current?.reset();
      setCode(result.recovery_code);
      onGenerated();
    });
  }
  return (
    <section className="panel">
      {code ? (
        <RecoveryCodeDisplay code={code} />
      ) : (
        <>
          <div className="section-head">
            <h2>Forgot-password recovery</h2>
            <KeyRound size={22} />
          </div>
          <p>
            {hasCode === null
              ? "Checking recovery setup…"
              : hasCode
                ? "You have a recovery code. Keep it safe — it cannot be displayed again."
                : "Set up a recovery code now, so a forgotten password won’t lock you out."}
          </p>
          <p className="field-hint">
            There is no email address on your account. Recovery uses this
            private, one-use code. Generating a new one replaces any previous
            code.
          </p>
          <form ref={form} onSubmit={submit}>
            <PasswordInput
              name="current_password"
              label="Current password for recovery setup"
            />
            <ErrorMessage message={error} />
            <button className="button secondary" disabled={pending}>
              {pending
                ? "Generating…"
                : hasCode
                  ? "Generate replacement code"
                  : "Generate recovery code"}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
