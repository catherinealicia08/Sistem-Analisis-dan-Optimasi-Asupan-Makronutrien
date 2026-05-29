import { RecommendationsPage } from "../pages/RecommendationsPage";
import { useAuth } from "../auth/AuthContext";
import { useMacroData } from "../data/MacroDataContext";

export function RecommendationsRoute() {
  const { user } = useAuth();
  const { analysis, date, refresh } = useMacroData();
  return (
    <RecommendationsPage
      userId={user?.id ?? null}
      date={date}
      analysis={analysis}
      onApplied={refresh}
    />
  );
}
