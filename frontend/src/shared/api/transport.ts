import { Capacitor } from "@capacitor/core";
import { nativeApiUrl } from "./nativeApiUrl";

export function appFetch(path: string, options: RequestInit = {}) {
  if (!path.startsWith("/api/")) throw new Error("Invalid API path.");
  const configured = import.meta.env.VITE_API_ORIGIN as string;
  const native = Capacitor.isNativePlatform();
  const url = configured || native ? nativeApiUrl(path, configured) : path;
  return fetch(url, {
    ...options,
    credentials: native ? "include" : "same-origin",
  });
}
