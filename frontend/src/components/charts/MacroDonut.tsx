import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface Props {
  protein: number; // grams
  carbs: number;
  fat: number;
  height?: number;
}

export function MacroDonut({ protein, carbs, fat, height = 240 }: Props) {
  const data = [
    { name: "Protein", grams: protein, value: protein * 4, color: "#EF4444" },
    { name: "Carbs",   grams: carbs,   value: carbs * 4,   color: "#F59E0B" },
    { name: "Fat",     grams: fat,     value: fat * 9,     color: "#06B6D4" },
  ];
  const totalKcal = data.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip
            formatter={(v: number, _n, item: any) => {
              const pct = totalKcal > 0 ? ((v / totalKcal) * 100).toFixed(0) : "0";
              return [`${item.payload.grams.toFixed(1)} g (${pct}%)`, item.payload.name];
            }}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12, color: "#6B7280" }}
            formatter={(_v, _e, idx) => {
              const item = data[idx as number];
              const pct = totalKcal > 0 ? ((item.value / totalKcal) * 100).toFixed(0) : "0";
              return (
                <span style={{ color: "#374151" }}>
                  {item.name} <span style={{ color: "#6B7280" }}>{item.grams.toFixed(0)}g ({pct}%)</span>
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
