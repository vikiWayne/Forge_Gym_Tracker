import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
export function PasswordField({ register }: { register: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-field">
      <label htmlFor="account-password">Password</label>
      <div className="password-input">
        <input
          id="account-password"
          name="password"
          type={visible ? "text" : "password"}
          autoComplete={register ? "new-password" : "current-password"}
          placeholder={
            register
              ? "8+ characters. Make it a strong one."
              : "Your secret training pass"
          }
          minLength={8}
          maxLength={128}
          required
        />
        <button
          type="button"
          className="icon-button password-toggle"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
