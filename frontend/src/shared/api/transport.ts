import { Capacitor } from "@capacitor/core";
import { nativeApiUrl } from "./nativeApiUrl";

// Native fetch is patched by CapacitorHttp; its native cookie jar keeps session
// cookies outside JavaScript. Browser requests retain their same-origin path.
export function appFetch(path: string, options: RequestInit = {}) {
  if (!path.startsWith("/api/")) throw new Error("Invalid API path.");
  if (!Capacitor.isNativePlatform()) return fetch(path, options);
  const configured = import.meta.env.VITE_NATIVE_API_URL as string | undefined;
  if (!configured)
    throw new Error("This native build has no configured API server.");
  return fetch(nativeApiUrl(path, configured), {
    ...options,
    credentials: "include",
  });
}
