import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";
import { api } from "../../shared/api/client";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { PasswordChangeForm } from "./PasswordChangeForm";
import { RecoveryCodeSettings } from "./RecoveryCodeSettings";
export function SecuritySettings() {
  const [hasCode, setHasCode] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const load = useCallback(() => {
    void api<{ has_recovery_code: boolean }>("/me/security")
      .then((data) => {
        setHasCode(data.has_recovery_code);
        setError("");
      })
      .catch((cause) => setError(cause.message));
  }, []);
  useEffect(load, [load]);
  return (
    <details className="security-settings panel security-disclosure">
      <summary>
        <ShieldCheck size={23} />
        <div>
          <strong>Account security</strong>
          <span>Password & recovery code</span>
        </div>
        <ChevronDown size={18} />
      </summary>
      <div className="security-content">
        <ErrorMessage message={error} />
        <PasswordChangeForm
          onChanged={() => {
            setRevision((value) => value + 1);
            load();
          }}
        />
        <RecoveryCodeSettings
          key={revision}
          hasCode={hasCode}
          onGenerated={load}
        />
      </div>
    </details>
  );
}
