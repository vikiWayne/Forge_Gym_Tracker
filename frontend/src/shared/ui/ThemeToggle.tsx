import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../app/providers/ThemeProvider";
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={`Light Dark theme. Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <span className={theme === "light" ? "selected" : ""}>
        <Sun size={16} />
        <span>Light</span>
      </span>{" "}
      <span className={theme === "dark" ? "selected" : ""}>
        <Moon size={16} />
        <span>Dark</span>
      </span>
    </button>
  );
}
