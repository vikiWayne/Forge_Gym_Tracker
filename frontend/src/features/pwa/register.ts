export const PWA_UPDATE_EVENT = "forge:pwa-update";
export const PWA_INSTALL_EVENT = "forge:pwa-install";
export type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
let installPrompt: InstallPrompt | null = null;
let registration: ServiceWorkerRegistration | undefined;
export function getInstallPrompt() {
  return installPrompt;
}
export function clearInstallPrompt() {
  installPrompt = null;
}
export function registerAppWorker() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event as InstallPrompt;
    window.dispatchEvent(new Event(PWA_INSTALL_EVENT));
  });
  window.addEventListener("appinstalled", clearInstallPrompt);
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  const announce = () => window.dispatchEvent(new Event(PWA_UPDATE_EVENT));
  window.addEventListener(
    "load",
    () => {
      void navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}sw.js`, {
          scope: import.meta.env.BASE_URL,
        })
        .then((next) => {
          registration = next;
          if (next.waiting) announce();
          next.addEventListener("updatefound", () => {
            next.installing?.addEventListener("statechange", () => {
              if (next.waiting && navigator.serviceWorker.controller)
                announce();
            });
          });
        })
        .catch(() => {});
    },
    { once: true },
  );
}
export function hasAppUpdate() {
  return !!registration?.waiting;
}
export function activateAppUpdate() {
  if (!registration?.waiting) return;
  navigator.serviceWorker.addEventListener(
    "controllerchange",
    () => window.location.reload(),
    { once: true },
  );
  registration.waiting.postMessage({ type: "ACTIVATE_UPDATE" });
}
