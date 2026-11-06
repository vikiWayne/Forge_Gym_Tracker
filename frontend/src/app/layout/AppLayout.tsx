import { MobileNav } from "./MobileNav";
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
  Zap,
  Scale,
  Utensils,
  Plus,
  CalendarDays,
} from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { useTraining } from "../providers/TrainingProvider";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { Brand } from "../../shared/ui/Brand";
import { ThemeToggle } from "../../shared/ui/ThemeToggle";
import { ErrorMessage, LoadingState } from "../../shared/ui/Feedback";
const navigation = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/workouts", label: "Workout log", icon: Dumbbell },
  { to: "/exercises", label: "Exercises", icon: Activity },
  { to: "/protein", label: "Protein", icon: Utensils },
  { to: "/body-weight", label: "Body weight", icon: Scale },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/together", label: "Together", icon: Users },
];
export function AppLayout() {
  const { user, logout } = useAuth();
  const { loading, error: dataError, logs, refresh, plans } = useTraining();
  const { pending, error, run } = useAsyncAction();
  const { pathname } = useLocation();
  const invitationCount = plans.filter((plan) => !plan.accepted).length;
  const title =
    navigation.find((item) => pathname.startsWith(item.to))?.label ||
    "Your profile";
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <NavLink to="/dashboard" aria-label="Forge home">
          <Brand />
        </NavLink>
        <div className="nav-label">YOUR LITTLE CORNER OF STRONG</div>
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
                `nav-link ${isActive ? "active" : ""}`
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
          <div className="journey-card">
            <span className="journey-icon">
              <Zap size={20} />
            </span>
            <strong>Your journey, your pace.</strong>
            <p>
              {logs.length
                ? `${logs.length} workout${logs.length === 1 ? "" : "s"} logged. Every one counts.`
                : "Your first rep is the start of something good."}
            </p>
          </div>
          <NavLink to="/profile" className="nav-link">
            <Settings2 size={19} />
            <span>Profile & settings</span>
          </NavLink>
          <button
            className="nav-link logout"
            disabled={pending}
            onClick={() => void run(logout)}
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
