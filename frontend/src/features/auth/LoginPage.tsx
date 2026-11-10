import { useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { api } from "../../shared/api/client";
import { Brand } from "../../shared/ui/Brand";
import { ThemeToggle } from "../../shared/ui/ThemeToggle";
import { LoadingState } from "../../shared/ui/Feedback";
import { AuthStory } from "./AuthStory";
import { CredentialsForm } from "./CredentialsForm";
import { OnboardingFlow } from "./OnboardingFlow";
export function LoginPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [setupEmail, setSetupEmail] = useState<string | null>(null);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const requestedPath = (location.state as { from?: string } | null)?.from;
  const destination =
    requestedPath?.startsWith("/") &&
    !requestedPath.startsWith("//") &&
    requestedPath !== "/login"
      ? requestedPath
      : "/dashboard";
  useEffect(() => {
    let active = true;
    if (user) {
      setCheckingSetup(false);
      return;
    }
    void api<{ email: string | null }>("/auth/onboarding")
      .then((result) => {
        if (active) setSetupEmail(result.email);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setCheckingSetup(false);
      });
    return () => {
      active = false;
    };
  }, [user]);
  if (user) return <Navigate to={destination} replace />;
  return (
    <div className="auth-page">
      <header className="auth-header">
        <Brand />
        <ThemeToggle />
      </header>
      <main className="auth-grid" id="main">
        <AuthStory />
        <section className="auth-form-panel">
          {checkingSetup ? (
            <LoadingState />
          ) : setupEmail ? (
            <OnboardingFlow
              email={setupEmail}
              onRestart={() => setSetupEmail(null)}
            />
          ) : (
            <CredentialsForm onSetup={setSetupEmail} />
          )}
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
