import { RecoveryCodeDisplay } from "../security/RecoveryCodeDisplay";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { api } from "../../shared/api/client";
import type { User } from "../../shared/api/types";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { OnboardingArt } from "./OnboardingArt";
const steps = [
  {
    title: "Every age has a next chapter.",
    description: "How many candles are on your next personal best?",
    label: "Age",
  },
  {
    title: "A starting point, not a score.",
    description: "What’s your current body weight? You can update it anytime.",
    label: "Body weight (kg)",
  },
  {
    title: "Make this space yours.",
    description:
      "One last profile detail, then it’s time to meet your dashboard.",
    label: "Sex",
  },
];
export function OnboardingFlow({
  username,
  onRestart,
}: {
  username: string;
  onRestart: () => void;
}) {
  const [step, setStep] = useState(0);
  const [created, setCreated] = useState<
    (User & { recovery_code: string }) | null
  >(null);
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [sex, setSex] = useState("Prefer not to say");
  const { pending, error, run, clearError } = useAsyncAction();
  const { authenticate } = useAuth();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus({ preventScroll: true }), [step]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();
    if (step < 2) {
      setStep((value) => value + 1);
      return;
    }
    void run(async () => {
      setCreated(
        await api<User & { recovery_code: string }>(
          "/auth/onboarding",
          "POST",
          { age: Number(age), weight: Number(weight), sex },
        ),
      );
    });
  }
  if (created)
    return (
      <RecoveryCodeDisplay
        code={created.recovery_code}
        onDone={() => authenticate(created)}
      />
    );
  return (
    <div className="onboarding-flow">
      <div className="onboarding-welcome">
        <span className="section-kicker">YOUR ORIGIN STORY</span>
        <p>
          Nice to meet you, <strong>{username}</strong>.
        </p>
      </div>
      <ol className="onboarding-progress" aria-label="Profile setup progress">
        {steps.map((item, index) => (
          <li
            key={item.label}
            className={index <= step ? "active" : ""}
            aria-current={index === step ? "step" : undefined}
          >
            <span>{index < step ? <Check size={12} /> : index + 1}</span>
            {item.label}
          </li>
        ))}
      </ol>
      <form onSubmit={submit}>
        <div className="onboarding-step" key={step}>
          <OnboardingArt step={step} />
          <div className="auth-form-heading">
            <h2 ref={heading} tabIndex={-1}>
              {steps[step].title}
            </h2>
            <p>{steps[step].description}</p>
          </div>
          {step === 0 ? (
            <label>
              Age
              <input
                type="number"
                name="age"
                value={age}
                onChange={(event) => setAge(event.target.value)}
                min={13}
                max={110}
                placeholder="Your age"
                required
              />
            </label>
          ) : step === 1 ? (
            <label>
              Body weight (kg)
              <input
                type="number"
                name="weight"
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                min={0.01}
                max={500}
                step="0.01"
                placeholder="Your current weight"
                required
              />
            </label>
          ) : (
            <label>
              Sex
              <select
                name="sex"
                value={sex}
                onChange={(event) => setSex(event.target.value)}
              >
                <option>Prefer not to say</option>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </label>
          )}
          {step === 2 && (
            <p className="onboarding-summary">
              Your starting point: {age} years · {weight} kg. You can update
              these details in your profile.
            </p>
          )}
        </div>
        <ErrorMessage message={error} />
        <div className="form-actions">
          {step > 0 && (
            <button
              type="button"
              className="button secondary"
              disabled={pending}
              onClick={() => {
                clearError();
                setStep((value) => value - 1);
              }}
            >
              <ArrowLeft size={15} />
              Back
            </button>
          )}
          <button className="button primary" disabled={pending}>
            {pending
              ? "Setting up your corner…"
              : step === 2
                ? "Finish setup"
                : "Next little step"}
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
      <button
        className="text-link onboarding-restart"
        disabled={pending}
        onClick={() =>
          void run(async () => {
            await api("/auth/onboarding", "DELETE");
            onRestart();
          })
        }
      >
        Use a different username or password
      </button>
    </div>
  );
}
