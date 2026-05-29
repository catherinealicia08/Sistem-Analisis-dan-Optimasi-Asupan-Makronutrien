import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MacroIntake } from "../../types";

interface Props {
  data: MacroIntake[];
  endDate: string;
  height?: number;
}

export function WeeklyTrend({ data, endDate, height = 220 }: Props) {
  const labels = buildLabels(endDate, data.length);
  const chart = data.map((d, i) => ({ day: labels[i], calories: Math.round(d.calories) }));
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chart} margin={{ top: 10, right: 12, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="weeklyArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22C55E" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#F3F4F6" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: "#6B7280", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#6B7280", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip formatter={(v: number) => [`${v} kcal`, "Calories"]} />
          <Area
            type="monotone"
            dataKey="calories"
            stroke="#22C55E"
            strokeWidth={2.5}
            fill="url(#weeklyArea)"
            dot={{ r: 3, stroke: "#22C55E", strokeWidth: 2, fill: "#FFFFFF" }}
            activeDot={{ r: 5, fill: "#22C55E", stroke: "#FFFFFF", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function buildLabels(endIso: string, n: number): string[] {
  const out: string[] = [];
  const end = new Date(endIso);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    out.push(d.toLocaleDateString("en-US", { weekday: "short" }));
  }
  return out;
}
