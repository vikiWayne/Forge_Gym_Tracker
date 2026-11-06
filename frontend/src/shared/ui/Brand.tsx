import { Dumbbell } from "lucide-react";
export function Brand() {
  return (
    <span className="brand">
      <span className="brand-icon">
        <Dumbbell size={24} />
      </span>
      forge<span className="brand-period">.</span>
    </span>
  );
}
