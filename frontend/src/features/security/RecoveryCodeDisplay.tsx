import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
export function RecoveryCodeDisplay({
  code,
  onDone,
}: {
  code: string;
  onDone?: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setMessage("Copied. Store this somewhere safe outside this app.");
    } catch {
      setMessage(
        "Copy isn’t available here. Select the code below and copy it manually.",
      );
    }
  }
  return (
    <section className="recovery-code-display">
      <span className="panel-icon">
        <KeyRound size={25} />
      </span>
      <h2>Your account’s spare key.</h2>
      <p>
        Save this recovery code in a password manager or another private place.
        It lets you reset a forgotten password. We only show it once.
      </p>
      <label>
        Recovery code
        <textarea
          className="recovery-code"
          readOnly
          value={code}
          spellCheck={false}
          aria-describedby="recovery-code-note"
        />
      </label>
      <button
        type="button"
        className="button secondary"
        onClick={() => void copy()}
      >
        <Copy size={16} />
        Copy recovery code
      </button>
      {message && (
        <p className="field-hint" role="status">
          {message}
        </p>
      )}
      <p id="recovery-code-note" className="field-hint">
        Never share this code. It can be used once. Creating another code or
        changing your password invalidates this one.
      </p>
      {onDone && (
        <>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={saved}
              onChange={(event) => setSaved(event.target.checked)}
            />
            I’ve saved my recovery code somewhere safe.
          </label>
          <button
            className="button primary full-width"
            disabled={!saved}
            onClick={onDone}
          >
            <Check size={17} />
            Continue to my dashboard
          </button>
        </>
      )}
    </section>
  );
}
