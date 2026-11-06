import { useState } from "react";
import {
  Activity,
  CalendarDays,
  Dumbbell,
  Home,
  MoreHorizontal,
  Plus,
  Scale,
  Settings2,
  TrendingUp,
  Users,
  Utensils,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useTraining } from "../providers/TrainingProvider";
import { Modal } from "../../shared/ui/Modal";
const links = [
  { to: "/calendar", label: "Workout calendar", icon: CalendarDays },
  { to: "/workouts", label: "Workout journal", icon: Dumbbell },
  { to: "/exercises", label: "Exercise library", icon: Activity },
  { to: "/progress", label: "Exercise progress", icon: TrendingUp },
  { to: "/together", label: "Together", icon: Users },
  { to: "/profile", label: "Profile & security", icon: Settings2 },
];
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { plans } = useTraining();
  const count = plans.filter((plan) => !plan.accepted).length;
  return (
    <>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        <NavLink to="/dashboard">
          <Home size={20} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/protein">
          <Utensils size={20} />
          <span>Protein</span>
        </NavLink>
        <NavLink
          to="/workouts/new"
          className={({ isActive }) =>
            `mobile-log-workout ${isActive ? "active" : ""}`
          }
          aria-label="Log workout"
        >
          <span className="mobile-log-icon">
            <Plus size={27} />
          </span>
          <span className="mobile-log-label">Log workout</span>
        </NavLink>
        <NavLink to="/body-weight">
          <Scale size={20} />
          <span>Weight</span>
        </NavLink>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`More pages${count ? `, ${count} pending invitations` : ""}`}
        >
          <MoreHorizontal size={21} />
          <span>More</span>
          {count > 0 && <b className="mobile-more-count">{count}</b>}
        </button>
      </nav>
      {open && (
        <Modal title="Your training space" close={() => setOpen(false)}>
          <nav className="mobile-more-menu" aria-label="More pages">
            {links.map(({ to, label, icon: Icon }) => (
              <Link to={to} key={to} onClick={() => setOpen(false)}>
                <Icon size={21} />
                <span>{label}</span>
                {to === "/together" && count > 0 && (
                  <b className="count-tag">{count} invitations</b>
                )}
              </Link>
            ))}
          </nav>
        </Modal>
      )}
    </>
  );
}
