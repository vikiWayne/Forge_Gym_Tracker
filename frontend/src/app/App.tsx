import { RouteScrollReset } from "./layout/RouteScrollReset";
import { NativeWorkoutProvider } from "../features/native/NativeWorkoutProvider";
import { ForgotPasswordPage } from "../features/security/ForgotPasswordPage";
import { ActionFeedback } from "../shared/ui/ActionFeedback";
import { InteractionEffects } from "../shared/ui/InteractionEffects";
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
const ExplorePage = lazy(() =>
  import("../features/explore/ExplorePage").then((module) => ({
    default: module.ExplorePage,
  })),
);
const WeeklyGoalsPage = lazy(() =>
  import("../features/goals/WeeklyGoalsPage").then((module) => ({
    default: module.WeeklyGoalsPage,
  })),
);
const SchedulePage = lazy(() =>
  import("../features/schedule/SchedulePage").then((module) => ({
    default: module.SchedulePage,
  })),
);
const OverloadPage = lazy(() =>
  import("../features/overload/OverloadPage").then((module) => ({
    default: module.OverloadPage,
  })),
);
const MuscleGroupsPage = lazy(() =>
  import("../features/muscles/MuscleGroupsPage").then((module) => ({
    default: module.MuscleGroupsPage,
  })),
);
const AlternativesPage = lazy(() =>
  import("../features/alternatives/AlternativesPage").then((module) => ({
    default: module.AlternativesPage,
  })),
);
const PhotosPage = lazy(() =>
  import("../features/photos/PhotosPage").then((module) => ({
    default: module.PhotosPage,
  })),
);
const MeasurementsPage = lazy(() =>
  import("../features/measurements/MeasurementsPage").then((module) => ({
    default: module.MeasurementsPage,
  })),
);
const RecoveryPage = lazy(() =>
  import("../features/recovery/RecoveryPage").then((module) => ({
    default: module.RecoveryPage,
  })),
);
const RoutinesPage = lazy(() =>
  import("../features/routines/RoutinesPage").then((module) => ({
    default: module.RoutinesPage,
  })),
);
const ActiveWorkoutPage = lazy(() =>
  import("../features/routines/ActiveWorkoutPage").then((module) => ({
    default: module.ActiveWorkoutPage,
  })),
);
const CalendarPage = lazy(() =>
  import("../features/calendar/CalendarPage").then((module) => ({
    default: module.CalendarPage,
  })),
);
const ProteinPage = lazy(() =>
  import("../features/protein/ProteinPage").then((module) => ({
    default: module.ProteinPage,
  })),
);
const BodyWeightPage = lazy(() =>
  import("../features/bodyWeight/BodyWeightPage").then((module) => ({
    default: module.BodyWeightPage,
  })),
);
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
const PlanDetailsPage = lazy(() =>
  import("../features/plans/PlanDetailsPage").then((module) => ({
    default: module.PlanDetailsPage,
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
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route element={<ProtectedRoutes />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/workouts" element={<WorkoutsPage />} />
          <Route path="/routines" element={<RoutinesPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/goals" element={<WeeklyGoalsPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/overload" element={<OverloadPage />} />
          <Route path="/muscles" element={<MuscleGroupsPage />} />
          <Route path="/alternatives" element={<AlternativesPage />} />
          <Route path="/photos" element={<PhotosPage />} />
          <Route path="/measurements" element={<MeasurementsPage />} />
          <Route path="/recovery" element={<RecoveryPage />} />
          <Route path="/workouts/active" element={<ActiveWorkoutPage />} />
          <Route path="/workouts/new" element={<WorkoutEditorPage />} />
          <Route path="/workouts/:id/edit" element={<WorkoutEditorPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/protein" element={<ProteinPage />} />
          <Route path="/body-weight" element={<BodyWeightPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/together" element={<PlansPage />} />
          <Route path="/together/:id" element={<PlanDetailsPage />} />
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
      <BrowserRouter
        basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}
      >
        <RouteScrollReset />
        <AuthProvider>
          <NativeWorkoutProvider>
            <AppRoutes />
            <ActionFeedback />
            <InteractionEffects />
          </NativeWorkoutProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
