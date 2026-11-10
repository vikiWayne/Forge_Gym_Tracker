import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../app/providers/ThemeProvider";
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const label = "Switch to " + (theme === "dark" ? "light" : "dark") + " mode";
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
