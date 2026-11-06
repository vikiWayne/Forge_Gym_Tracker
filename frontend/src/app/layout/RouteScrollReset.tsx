import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
export function RouteScrollReset() {
  const { pathname, hash } = useLocation();
  useLayoutEffect(() => {
    if (!hash) window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);
  return null;
}
