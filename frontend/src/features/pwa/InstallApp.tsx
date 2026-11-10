import { useEffect, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import {
  activateAppUpdate,
  hasAppUpdate,
  PWA_UPDATE_EVENT,
  PWA_INSTALL_EVENT,
  getInstallPrompt,
  clearInstallPrompt,
  type InstallPrompt,
} from "./register";
import "./pwa.css";
export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(getInstallPrompt);
  const [installed, setInstalled] = useState(
    () => window.matchMedia("(display-mode: standalone)").matches,
  );
  const [update, setUpdate] = useState(hasAppUpdate);
  const [help, setHelp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const receive = () => setPrompt(getInstallPrompt());
    const done = () => {
      setInstalled(true);
      setPrompt(null);
    };
    const updated = () => setUpdate(true);
    window.addEventListener(PWA_INSTALL_EVENT, receive);
    window.addEventListener("appinstalled", done);
    window.addEventListener(PWA_UPDATE_EVENT, updated);
    return () => {
      window.removeEventListener(PWA_INSTALL_EVENT, receive);
      window.removeEventListener("appinstalled", done);
      window.removeEventListener(PWA_UPDATE_EVENT, updated);
    };
  }, []);
  async function install() {
    if (!prompt) {
      setHelp((value) => !value);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setPrompt(null);
      clearInstallPrompt();
    } catch {
      setError(
        "The browser could not open installation. Use its Install app menu instead.",
      );
      setHelp(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel pwa-install-panel" aria-label="Install FORGE">
      <div>
        <h2>
          {installed ? "FORGE is on your home screen." : "Keep FORGE close."}
        </h2>
        <p>
          {installed
            ? "Open your training space like an app."
            : "Install FORGE for a dedicated window and quick access to your training."}
        </p>
      </div>
      {!installed && (
        <button
          type="button"
          className="button secondary"
          disabled={busy}
          onClick={() => void install()}
        >
          <Download size={17} />
          {busy
            ? "Opening install…"
            : prompt
              ? "Install FORGE"
              : "How to install"}
        </button>
      )}
      {help && !installed && (
        <p className="pwa-install-help">
          On iPhone or iPad, open this site in Safari, choose Share, then Add to
          Home Screen. On desktop or Android, use your browser’s Install app or
          Add to Home Screen menu. Installation requires HTTPS or localhost and
          a supported browser.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {update && (
        <div className="pwa-update">
          <p>
            A new version is ready. Finish saving your current work before
            updating.
          </p>
          <button
            type="button"
            className="button secondary"
            onClick={activateAppUpdate}
          >
            <RefreshCw size={16} />
            Update & reload
          </button>
        </div>
      )}
    </section>
  );
}
