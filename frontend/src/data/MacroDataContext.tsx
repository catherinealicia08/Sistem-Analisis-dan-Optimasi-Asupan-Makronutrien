import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Analysis,
  DailyLog,
  MacroIntake,
  MetabolicTargets,
} from "../types";
import { api } from "../api/client";
import { todayISO } from "../lib/format";
import { useAuth } from "../auth/AuthContext";

interface MacroData {
  date: string;
  setDate: (iso: string) => void;
  targets: MetabolicTargets | null;
  log: DailyLog | null;
  analysis: Analysis | null;
  weekly: MacroIntake[];
  error: string | null;
  refresh: () => Promise<void>;
}

const Ctx = createContext<MacroData | null>(null);

export function MacroDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [date, setDate] = useState<string>(todayISO());
  const [targets, setTargets] = useState<MetabolicTargets | null>(null);
  const [log, setLog] = useState<DailyLog | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [weekly, setWeekly] = useState<MacroIntake[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const [t, l, a, w] = await Promise.all([
        api.getTargets(user.id),
        api.getLog(user.id, date),
        api.analyze(user.id, date),
        api.weeklyIntake(user.id, date),
      ]);
      setTargets(t);
      setLog(l);
      setAnalysis(a);
      setWeekly(w);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [user, date]);

  useEffect(() => {
    if (user) refresh();
    else {
      setTargets(null); setLog(null); setAnalysis(null); setWeekly([]);
    }
  }, [user, date, refresh]);

  const value = useMemo<MacroData>(() => ({
    date, setDate, targets, log, analysis, weekly, error, refresh,
  }), [date, targets, log, analysis, weekly, error, refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMacroData(): MacroData {
  const v = useContext(Ctx);
  if (!v) throw new Error("useMacroData must be used inside <MacroDataProvider>");
  return v;
}
