import { useEffect, useState, type CSSProperties } from "react";
type Tap = { id: number; x: number; y: number };
/** One short, decorative tap ring; never covers controls or stores input values. */
export function InteractionEffects() {
  const [tap, setTap] = useState<Tap | null>(null);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setTimeout> | undefined;
    const animateTap = (event: MouseEvent) => {
      if (preference.matches || !(event.target instanceof Element)) return;
      const target = event.target.closest<HTMLElement>(
        "button,a[href],input[type=checkbox],input[type=radio]",
      );
      if (
        !target ||
        target.matches(":disabled") ||
        target.getAttribute("aria-disabled") === "true"
      )
        return;
      const bounds = target.getBoundingClientRect();
      setTap({
        id: performance.now(),
        x: event.detail === 0 ? bounds.left + bounds.width / 2 : event.clientX,
        y: event.detail === 0 ? bounds.top + bounds.height / 2 : event.clientY,
      });
      clearTimeout(timer);
      timer = setTimeout(() => setTap(null), 420);
    };
    const stop = () => {
      if (preference.matches) setTap(null);
    };
    document.addEventListener("click", animateTap, true);
    preference.addEventListener("change", stop);
    return () => {
      document.removeEventListener("click", animateTap, true);
      preference.removeEventListener("change", stop);
      clearTimeout(timer);
    };
  }, []);
  return (
    <div className="interaction-effects" aria-hidden="true">
      {tap && (
        <span
          key={tap.id}
          className="interaction-tap"
          style={
            {
              "--tap-x": `${tap.x}px`,
              "--tap-y": `${tap.y}px`,
            } as CSSProperties
          }
        />
      )}
    </div>
  );
}
