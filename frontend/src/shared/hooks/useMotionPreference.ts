import { useEffect, useState } from "react";
/** JS-driven charts follow the same live accessibility setting as CSS motion. */
export function useMotionPreference() {
  const [allowed, setAllowed] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setAllowed(!preference.matches);
    preference.addEventListener("change", update);
    update();
    return () => preference.removeEventListener("change", update);
  }, []);
  return allowed;
}
