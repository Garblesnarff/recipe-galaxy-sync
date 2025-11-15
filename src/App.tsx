import { Route, Routes, Navigate } from "react-router-dom";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import RecipeDetail from "@/pages/RecipeDetail";
import AddRecipe from "@/pages/AddRecipe";
import GroceryList from "@/pages/GroceryList";
import EditRecipe from "@/pages/EditRecipe";
import Collections from "@/pages/Collections";
import CollectionDetail from "@/pages/CollectionDetail";
import EditCollection from "@/pages/EditCollection";
import LandingPage from "@/pages/LandingPage";
import Demo from "@/pages/Demo";
import "./App.css";
import AuthPage from "@/pages/Auth";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AdaptRecipe from "@/pages/AdaptRecipe";
import Workouts from "@/pages/Workouts";
import WorkoutDetail from "@/pages/WorkoutDetail";
import AddWorkout from "@/pages/AddWorkout";
import EditWorkout from "@/pages/EditWorkout";
import ExerciseLibrary from "@/pages/ExerciseLibrary";
import WorkoutTemplates from "@/pages/WorkoutTemplates";
import ActiveWorkout from "@/pages/ActiveWorkout";
import WorkoutHistory from "@/pages/WorkoutHistory";
import WorkoutProgress from "@/pages/WorkoutProgress";
import WorkoutSchedule from "@/pages/WorkoutSchedule";
import Achievements from "@/pages/Achievements";

// Helper component to restrict access for authenticated users only
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { session, isChecking } = useAuthSession();
  const location = useLocation();
  const navigate = useNavigate();

  // If not logged in, redirect to /auth
  useEffect(() => {
    if (!isChecking && !session) {
      navigate("/auth", { replace: true, state: { from: location.pathname } });
    }
  }, [session, isChecking, navigate, location.pathname]);

  if (isChecking) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (!session) return null; // Will redirect

  return <>{children}</>;
}

// Helper for redirecting logged-in users away from /auth
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { session, isChecking } = useAuthSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isChecking && session) {
      navigate("/dashboard", { replace: true });
    }
  }, [session, isChecking, navigate]);

  if (isChecking) {
    return <div className="min-h-screen flex items-center justify-center">Checking session…</div>;
  }
  if (session) return null; // Will redirect

  return <>{children}</>;
}

function App() {
  return (
    <>
      <div className="app-container min-h-screen">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/auth" element={
            <AuthRoute>
              <AuthPage />
            </AuthRoute>
          } />
          {/* Private (authenticated) routes */}
          <Route path="/dashboard" element={<PrivateRoute><Index /></PrivateRoute>} />
          <Route path="/recipe/:id" element={<PrivateRoute><RecipeDetail /></PrivateRoute>} />
          <Route path="/add-recipe" element={<PrivateRoute><AddRecipe /></PrivateRoute>} />
          <Route path="/edit-recipe/:id" element={<PrivateRoute><EditRecipe /></PrivateRoute>} />
          <Route path="/grocery-list" element={<PrivateRoute><GroceryList /></PrivateRoute>} />
          <Route path="/collections" element={<PrivateRoute><Collections /></PrivateRoute>} />
          <Route path="/collections/:id" element={<PrivateRoute><CollectionDetail /></PrivateRoute>} />
          <Route path="/collections/edit/:id" element={<PrivateRoute><EditCollection /></PrivateRoute>} />
          <Route path="/adapt-recipe/:id" element={<PrivateRoute><AdaptRecipe /></PrivateRoute>} />

          {/* Workout Routes */}
          <Route path="/workouts" element={<PrivateRoute><Workouts /></PrivateRoute>} />
          <Route path="/workouts/add" element={<PrivateRoute><AddWorkout /></PrivateRoute>} />
          <Route path="/workouts/templates" element={<PrivateRoute><WorkoutTemplates /></PrivateRoute>} />
          <Route path="/workouts/exercises" element={<PrivateRoute><ExerciseLibrary /></PrivateRoute>} />
          <Route path="/workouts/history" element={<PrivateRoute><WorkoutHistory /></PrivateRoute>} />
          <Route path="/workouts/progress" element={<PrivateRoute><WorkoutProgress /></PrivateRoute>} />
          <Route path="/workout-schedule" element={<PrivateRoute><WorkoutSchedule /></PrivateRoute>} />
          <Route path="/achievements" element={<PrivateRoute><Achievements /></PrivateRoute>} />
          <Route path="/workouts/:id" element={<PrivateRoute><WorkoutDetail /></PrivateRoute>} />
          <Route path="/workouts/:id/start" element={<PrivateRoute><ActiveWorkout /></PrivateRoute>} />
          <Route path="/workouts/edit/:id" element={<PrivateRoute><EditWorkout /></PrivateRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
}
export default App;
