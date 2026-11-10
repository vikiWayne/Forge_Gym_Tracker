import { useEffect, useRef, useState } from "react";
import { Check, LoaderCircle, X } from "lucide-react";
import {
  ACTION_FEEDBACK_EVENT,
  type ActionFeedbackEvent,
} from "../lib/actionFeedback";

/** Persistent across route changes so completed actions still get a little nod. */
export function ActionFeedback() {
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [completed, setCompleted] = useState(0);
  const [visible, setVisible] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useEffect(() => {
    const receive = (event: Event) => {
      const { id, phase } = (event as CustomEvent<ActionFeedbackEvent>).detail;
      setPending((previous) => {
        const next = new Set(previous);
        if (phase === "pending") next.add(id);
        else next.delete(id);
        return next;
      });
      if (phase !== "success") return;
      clearTimeout(dismissTimer.current);
      setCompleted((count) => count + 1);
      setVisible(true);
      dismissTimer.current = setTimeout(() => setVisible(false), 2800);
    };
    window.addEventListener(ACTION_FEEDBACK_EVENT, receive);
    return () => {
      window.removeEventListener(ACTION_FEEDBACK_EVENT, receive);
      clearTimeout(dismissTimer.current);
    };
  }, []);
  return (
    <div className="action-feedback-layer">
      {pending.size > 0 && (
        <div className="action-progress" role="status">
          <LoaderCircle className="spin" size={15} />
          <span>Making it happen…</span>
        </div>
      )}
      {visible && (
        <div className="action-celebration" key={completed}>
          <span className="celebration-check" aria-hidden="true">
            <Check size={17} />
          </span>
          <span role="status">Saved. A little progress made.</span>
          <button
            type="button"
            className="icon-button"
            aria-label="Dismiss action confirmation"
            onClick={() => setVisible(false)}
          >
            <X size={14} />
          </button>
          <span className="celebration-spark spark-one" aria-hidden="true" />
          <span className="celebration-spark spark-two" aria-hidden="true" />
          <span className="celebration-spark spark-three" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
