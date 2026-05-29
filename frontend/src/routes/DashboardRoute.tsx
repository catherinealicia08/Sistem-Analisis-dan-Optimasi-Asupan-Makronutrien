import { DashboardPage } from "../pages/DashboardPage";
import { useAuth } from "../auth/AuthContext";
import { useMacroData } from "../data/MacroDataContext";

export function DashboardRoute() {
  const { user } = useAuth();
  const { analysis, weekly, date } = useMacroData();
  return <DashboardPage user={user} analysis={analysis} weekly={weekly} date={date} />;
}
