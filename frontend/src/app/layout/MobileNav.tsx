import { Compass, Dumbbell, House, Plus, TrendingUp } from "lucide-react";
import { NavLink } from "react-router-dom";
export function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <NavLink to="/dashboard">
        <House size={21} />
        <span>Today</span>
      </NavLink>
      <NavLink to="/routines">
        <Dumbbell size={21} />
        <span>Train</span>
      </NavLink>
      <NavLink
        to="/workouts/new"
        className={({ isActive }) =>
          "mobile-log-workout " + (isActive ? "active" : "")
        }
        aria-label="Log workout"
      >
        <span className="mobile-log-icon">
          <Plus size={27} />
        </span>
        <span className="mobile-log-label">Log</span>
      </NavLink>
      <NavLink to="/progress">
        <TrendingUp size={21} />
        <span>Progress</span>
      </NavLink>
      <NavLink to="/explore">
        <Compass size={21} />
        <span>Explore</span>
      </NavLink>
    </nav>
  );
}
