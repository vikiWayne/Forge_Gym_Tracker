import { MobileNav } from "./MobileNav";
import { OfflineStatus } from "../../features/offline/OfflineStatus";
import { InvitationNotifications } from "../../features/plans/InvitationNotifications";
import {
  Activity,
  ArrowUpRight,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Settings2,
  TrendingUp,
  Users,
  Scale,
  Utensils,
  Plus,
  CalendarDays,
  Compass,
} from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { useTraining } from "../providers/TrainingProvider";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { Brand } from "../../shared/ui/Brand";
import { ThemeToggle } from "../../shared/ui/ThemeToggle";
import { ErrorMessage, LoadingState } from "../../shared/ui/Feedback";
const navigation = [
  { to: "/dashboard", label: "Today", icon: LayoutDashboard },
  { to: "/workouts", label: "Workout log", icon: Dumbbell },
  { to: "/exercises", label: "Exercises", icon: Activity },
  { to: "/routines", label: "Routines", icon: Dumbbell },
  { to: "/explore", label: "Explore tools", icon: Compass },
  { to: "/protein", label: "Protein", icon: Utensils },
  { to: "/body-weight", label: "Body weight", icon: Scale },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/together", label: "Together", icon: Users },
];
const toolTitles: Record<string, string> = {
  "/goals": "Weekly goals",
  "/schedule": "Workout schedule",
  "/overload": "Progression suggestions",
  "/muscles": "Muscle groups",
  "/alternatives": "Exercise alternatives",
  "/measurements": "Body measurements",
  "/photos": "Progress photos",
  "/recovery": "Recovery journal",
};
export function AppLayout() {
  const { user, logout } = useAuth();
  const { loading, error: dataError, refresh, plans } = useTraining();
  const { pending, error, run } = useAsyncAction();
  const { pathname } = useLocation();
  const invitationCount = plans.filter((plan) => !plan.accepted).length;
  const title =
    navigation.find((item) => pathname.startsWith(item.to))?.label ||
    toolTitles[pathname] ||
    "Your profile";
  return (
    <div
      className={`app-shell ${pathname === "/workouts/active" ? "session-focused" : ""}`}
    >
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <NavLink to="/dashboard" aria-label="Forge home">
          <Brand />
        </NavLink>
        <div className="nav-label">YOUR TRAINING SPACE</div>
        <nav aria-label="Main navigation">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              aria-label={
                to === "/together" && invitationCount
                  ? `Together, ${invitationCount} pending invitations`
                  : label
              }
              className={({ isActive }) =>
                `nav-link ${isActive || (to === "/explore" && toolTitles[pathname]) ? "active" : ""}`
              }
            >
              <Icon size={19} />
              <span>{label}</span>
              {to === "/together" && invitationCount > 0 && (
                <b className="nav-invitation-count" aria-hidden="true">
                  {invitationCount}
                </b>
              )}
              <ArrowUpRight className="nav-arrow" size={15} />
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <NavLink to="/profile" className="nav-link">
            <Settings2 size={19} />
            <span>Profile & settings</span>
          </NavLink>
          <button
            className="nav-link logout"
            disabled={pending}
            onClick={() => void run(logout, { feedback: false })}
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="app-header">
          <div className="breadcrumb">
            <span className="breadcrumb-home">Your workspace</span>
            <span>/</span>
            <strong>{title}</strong>
          </div>
          <div className="header-actions">
            {!pathname.startsWith("/workouts/") && (
              <Link
                to="/workouts/new"
                className="button workout-cta header-workout-cta"
              >
                <Plus size={18} />
                Log workout
              </Link>
            )}
            <InvitationNotifications />
            <ThemeToggle />
            <NavLink
              className="account-avatar"
              to="/profile"
              aria-label={`${user?.username.slice(0, 2).toUpperCase()}: open your profile`}
            >
              {user?.username.slice(0, 2).toUpperCase()}
            </NavLink>
          </div>
        </header>
        <main id="main" className="page-container">
          <OfflineStatus />
          <ErrorMessage message={error} />
          {loading ? (
            <LoadingState />
          ) : dataError ? (
            <section className="panel">
              <ErrorMessage message={dataError} />
              <button
                className="button secondary"
                onClick={() => void run(refresh)}
              >
                Try again
              </button>
            </section>
          ) : (
            <div className="page-scene" key={pathname}>
              <Outlet />
            </div>
          )}
        </main>
        <footer className="workspace-footer">
          <span>A LITTLE PROGRESS, EVERY DAY.</span>
          <span>
            Made for your long game <span className="accent">✳</span>
          </span>
        </footer>
      </div>
      <MobileNav />
    </div>
  );
}
