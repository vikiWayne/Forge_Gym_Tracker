import { PasswordInput } from "../../shared/ui/PasswordInput";
export function PasswordField({ register }: { register: boolean }) {
  return (
    <PasswordInput
      name="password"
      label="Password"
      autoComplete={register ? "new-password" : "current-password"}
      placeholder={
        register
          ? "8+ characters. Make it a strong one."
          : "Your secret training pass"
      }
    />
  );
}
