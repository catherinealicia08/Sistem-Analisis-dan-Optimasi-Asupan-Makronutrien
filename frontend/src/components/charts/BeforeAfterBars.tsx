import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  current: { calories: number; protein: number; carbs: number; fat: number };
  optimized: { calories: number; protein: number; carbs: number; fat: number };
  height?: number;
}

export function BeforeAfterBars({ current, optimized, height = 260 }: Props) {
  const data = [
    { name: "Calories (kcal)", current: Math.round(current.calories), optimized: Math.round(optimized.calories) },
    { name: "Protein (g)",     current: Math.round(current.protein),  optimized: Math.round(optimized.protein) },
    { name: "Carbs (g)",       current: Math.round(current.carbs),    optimized: Math.round(optimized.carbs) },
    { name: "Fat (g)",         current: Math.round(current.fat),      optimized: Math.round(optimized.fat) },
  ];
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 18, right: 8, bottom: 0, left: -10 }}>
          <CartesianGrid stroke="#F3F4F6" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
          <Tooltip />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#374151" }}
            iconType="circle"
          />
          <Bar dataKey="current"   name="Current"   fill="#D1D5DB" radius={[6, 6, 0, 0]} maxBarSize={28}>
            {data.map((_, i) => <Cell key={i} />)}
          </Bar>
          <Bar dataKey="optimized" name="Optimized" fill="#22C55E" radius={[6, 6, 0, 0]} maxBarSize={28}>
            {data.map((_, i) => <Cell key={i} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
