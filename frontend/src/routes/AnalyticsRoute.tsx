import { AnalyticsPage } from "../pages/AnalyticsPage";
import { useMacroData } from "../data/MacroDataContext";

export function AnalyticsRoute() {
  const { analysis, date, setDate } = useMacroData();
  return <AnalyticsPage analysis={analysis} date={date} onChangeDate={setDate} />;
}
