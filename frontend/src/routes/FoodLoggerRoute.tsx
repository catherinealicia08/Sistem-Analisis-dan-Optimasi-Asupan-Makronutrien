import { FoodLoggerPage } from "../pages/FoodLoggerPage";
import { useAuth } from "../auth/AuthContext";
import { useMacroData } from "../data/MacroDataContext";

export function FoodLoggerRoute() {
  const { user } = useAuth();
  const { log, date, refresh } = useMacroData();
  if (!user) return null;
  return <FoodLoggerPage userId={user.id} date={date} log={log} onChange={refresh} />;
}
