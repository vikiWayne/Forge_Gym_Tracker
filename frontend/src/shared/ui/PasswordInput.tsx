import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
export function PasswordInput({
  name,
  label,
  autoComplete = "current-password",
  placeholder = "At least 8 characters",
}: {
  name: string;
  label: string;
  autoComplete?: "current-password" | "new-password";
  placeholder?: string;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          minLength={8}
          maxLength={128}
          required
        />
        <button
          type="button"
          className="icon-button password-toggle"
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
