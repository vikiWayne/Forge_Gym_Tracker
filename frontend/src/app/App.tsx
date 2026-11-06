import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./providers/AuthProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import { TrainingProvider } from "./providers/TrainingProvider";
import { AppLayout } from "./layout/AppLayout";
import { LoginPage } from "../features/auth/LoginPage";
const DashboardPage = lazy(() =>
  import("../features/dashboard/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  })),
);
const ExercisesPage = lazy(() =>
  import("../features/exercises/ExercisesPage").then((module) => ({
    default: module.ExercisesPage,
  })),
);
const WorkoutsPage = lazy(() =>
  import("../features/workouts/WorkoutsPage").then((module) => ({
    default: module.WorkoutsPage,
  })),
);
const WorkoutEditorPage = lazy(() =>
  import("../features/workouts/WorkoutEditorPage").then((module) => ({
    default: module.WorkoutEditorPage,
  })),
);
const ProgressPage = lazy(() =>
  import("../features/progress/ProgressPage").then((module) => ({
    default: module.ProgressPage,
  })),
);
const PlansPage = lazy(() =>
  import("../features/plans/PlansPage").then((module) => ({
    default: module.PlansPage,
  })),
);
const ProfilePage = lazy(() =>
  import("../features/profile/ProfilePage").then((module) => ({
    default: module.ProfilePage,
  })),
);
import { ErrorMessage, LoadingState } from "../shared/ui/Feedback";
function ProtectedRoutes() {
  const { user, loading, error, refresh } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingState />;
  if (error)
    return (
      <main className="connection-error">
        <ErrorMessage message={error} />
        <button className="button primary" onClick={() => void refresh()}>
          Reconnect
        </button>
      </main>
    );
  if (!user)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return (
    <TrainingProvider key={user.id}>
      <Suspense fallback={<LoadingState />}>
        <Outlet />
      </Suspense>
    </TrainingProvider>
  );
}
function AppRoutes() {
  const { loading } = useAuth();
  if (loading) return <LoadingState />;
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoutes />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/workouts" element={<WorkoutsPage />} />
          <Route path="/workouts/new" element={<WorkoutEditorPage />} />
          <Route path="/workouts/:id/edit" element={<WorkoutEditorPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/together" element={<PlansPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
