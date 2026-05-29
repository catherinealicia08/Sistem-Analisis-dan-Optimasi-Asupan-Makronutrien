import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

function FullScreenLoader() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        <p className="text-sm text-ink-500">Loading…</p>
      </div>
    </div>
  );
}

export function ProtectedRoute() {
  const { status, user } = useAuth();
  const location = useLocation();
  if (status === "loading") return <FullScreenLoader />;
  if (status !== "authenticated" || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (user.profile_complete === false && location.pathname !== "/profile-setup") {
    return <Navigate to="/profile-setup" replace />;
  }
  return <Outlet />;
}

export function GuestRoute() {
  const { status, user } = useAuth();
  if (status === "loading") return <FullScreenLoader />;
  if (status === "authenticated" && user) {
    return <Navigate to={user.profile_complete === false ? "/profile-setup" : "/dashboard"} replace />;
  }
  return <Outlet />;
}

export function ProfileSetupRoute() {
  const { status, user } = useAuth();
  if (status === "loading") return <FullScreenLoader />;
  if (status !== "authenticated" || !user) return <Navigate to="/login" replace />;
  if (user.profile_complete) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
