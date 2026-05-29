import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "./auth/AuthContext";
import { GuestRoute, ProfileSetupRoute, ProtectedRoute } from "./auth/guards";
import { MacroDataProvider } from "./data/MacroDataContext";
import { AppShell } from "./components/layout/AppShell";

import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ProfileSetupPage } from "./pages/ProfileSetupPage";
import { MealPlannerPage } from "./pages/MealPlannerPage";
import { ProgressPage } from "./pages/ProgressPage";
import { ScientificBasisPage } from "./pages/ScientificBasisPage";
import { DocumentationPage } from "./pages/DocumentationPage";

import { DashboardRoute } from "./routes/DashboardRoute";
import { FoodLoggerRoute } from "./routes/FoodLoggerRoute";
import { AnalyticsRoute } from "./routes/AnalyticsRoute";
import { RecommendationsRoute } from "./routes/RecommendationsRoute";
import { SettingsRoute } from "./routes/SettingsRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

function DataLayout() {
  return (
    <MacroDataProvider>
      <Outlet />
    </MacroDataProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/science" element={<ScientificBasisPage />} />
            <Route path="/docs"    element={<DocumentationPage />} />

            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route element={<ProfileSetupRoute />}>
              <Route path="/profile-setup" element={<ProfileSetupPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<DataLayout />}>
                <Route element={<AppShell />}>
                  <Route path="/dashboard"       element={<DashboardRoute />} />
                  <Route path="/food-logger"     element={<FoodLoggerRoute />} />
                  <Route path="/analytics"       element={<AnalyticsRoute />} />
                  <Route path="/recommendations" element={<RecommendationsRoute />} />
                  <Route path="/settings"        element={<SettingsRoute />} />
                  <Route path="/meal-planner" element={<MealPlannerPage />} />
                  <Route path="/progress"     element={<ProgressPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
