"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface PayoffChartProps {
  payoff: (perf: number) => number;
}

const POINTS = 120;
const MIN_PERF = 0.3;
const MAX_PERF = 1.5;

export default function PayoffChart({ payoff }: PayoffChartProps) {
  const data = Array.from({ length: POINTS + 1 }, (_, i) => {
    const perf = MIN_PERF + ((MAX_PERF - MIN_PERF) * i) / POINTS;
    return { perf: perf * 100, note: payoff(perf), stock: perf * 100 };
  });

  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis
            dataKey="perf"
            type="number"
            domain={[MIN_PERF * 100, MAX_PERF * 100]}
            ticks={[30, 50, 70, 90, 110, 130, 150]}
            tickFormatter={(v: number) => `${v}%`}
            stroke="var(--muted-foreground)"
            fontSize={12}
          />
          <YAxis
            tickFormatter={(v: number) => `${v.toFixed(0)}%`}
            stroke="var(--muted-foreground)"
            fontSize={12}
            width={48}
            domain={[20, "auto"]}
          />
          <Tooltip
            formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name === "note" ? "Note pays" : "Stock"]}
            labelFormatter={(perf) => `Final level: ${Number(perf).toFixed(0)}% of initial`}
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border-color)",
              borderRadius: 8,
              color: "var(--foreground)",
            }}
          />
          <ReferenceLine x={100} stroke="var(--muted-foreground)" strokeDasharray="2 4" />
          <ReferenceLine y={100} stroke="var(--muted-foreground)" strokeDasharray="2 4" />
          <Line
            type="linear"
            dataKey="stock"
            stroke="var(--cosmic)"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            dot={false}
            isAnimationActive={false}
          />
          <Line type="linear" dataKey="note" stroke="var(--accent)" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
