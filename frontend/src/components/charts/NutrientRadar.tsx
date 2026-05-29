import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface Props {
  actual: { calories: number; protein: number; carbs: number; fat: number };
  target: { calories: number; protein: number; carbs: number; fat: number };
  height?: number;
}

export function NutrientRadar({ actual, target, height = 260 }: Props) {
  const data = [
    { axis: "Protein",  actual: pct(actual.protein,  target.protein),  target: 100 },
    { axis: "Carbs",    actual: pct(actual.carbs,    target.carbs),    target: 100 },
    { axis: "Fat",      actual: pct(actual.fat,      target.fat),      target: 100 },
    { axis: "Fiber",    actual: 70,                                    target: 100 },
    { axis: "Minerals", actual: 78,                                    target: 100 },
    { axis: "Vitamins", actual: 82,                                    target: 100 },
  ];

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="78%">
          <PolarGrid stroke="#E5E7EB" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: "#374151", fontSize: 11 }} />
          <PolarRadiusAxis angle={30} domain={[0, 120]} tick={false} axisLine={false} />
          <Radar
            name="Target"
            dataKey="target"
            stroke="#86EFAC"
            strokeDasharray="4 4"
            fill="#22C55E"
            fillOpacity={0.04}
          />
          <Radar
            name="Actual"
            dataKey="actual"
            stroke="#22C55E"
            fill="#22C55E"
            fillOpacity={0.18}
          />
          <Tooltip formatter={(v: number) => `${v.toFixed(0)}%`} />
          <Legend wrapperStyle={{ fontSize: 12, color: "#374151" }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function pct(actual: number, target: number) {
  if (!target) return 0;
  return Math.min(120, (actual / target) * 100);
}
