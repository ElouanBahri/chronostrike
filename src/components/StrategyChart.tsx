"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BlackScholesInputs, OptionType } from "@/lib/blackScholes";
import { price } from "@/lib/blackScholes";
import type { Strategy } from "@/data/strategies";

interface StrategyChartProps {
  strategy: Strategy;
  /** inputs.spot is treated as the strategy's entry spot; inputs.strike is unused (legs carry their own). */
  inputs: BlackScholesInputs;
}

const POINTS = 60;

function legSign(position: "long" | "short"): number {
  return position === "long" ? 1 : -1;
}

function legPayoff(spot: number, strike: number, type: OptionType): number {
  return type === "call" ? Math.max(spot - strike, 0) : Math.max(strike - spot, 0);
}

export function netAt(strategy: Strategy, legStrikes: number[], inputs: BlackScholesInputs, spot: number) {
  let value = 0;
  let payoff = 0;
  strategy.legs.forEach((leg, i) => {
    const sign = legSign(leg.position);
    const strike = legStrikes[i];
    value += sign * price({ ...inputs, spot, strike }, leg.type);
    payoff += sign * legPayoff(spot, strike, leg.type);
  });
  return { value, payoff };
}

export default function StrategyChart({ strategy, inputs }: StrategyChartProps) {
  const centerSpot = inputs.spot;
  const legStrikes = strategy.legs.map((leg) => centerSpot * (1 + leg.strikeOffsetPct));

  const minSpot = Math.max(centerSpot * 0.5, 1);
  const maxSpot = centerSpot * 1.5;
  const step = (maxSpot - minSpot) / POINTS;

  const data = Array.from({ length: POINTS + 1 }, (_, i) => {
    const spot = minSpot + step * i;
    return { spot, ...netAt(strategy, legStrikes, inputs, spot) };
  });

  const current = netAt(strategy, legStrikes, inputs, centerSpot);

  return (
    <div className="h-64 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis
            dataKey="spot"
            tickFormatter={(v: number) => `$${v.toFixed(0)}`}
            stroke="var(--muted-foreground)"
            fontSize={12}
          />
          <YAxis
            tickFormatter={(v: number) => v.toFixed(2)}
            stroke="var(--muted-foreground)"
            fontSize={12}
            width={56}
          />
          <Tooltip
            formatter={(value) => Number(value).toFixed(2)}
            labelFormatter={(spot) => `Spot: $${Number(spot).toFixed(2)}`}
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border-color)",
              borderRadius: 8,
              color: "var(--foreground)",
            }}
          />
          <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2.5} dot={false} />
          <Line
            type="monotone"
            dataKey="payoff"
            stroke="var(--cosmic)"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            dot={false}
          />
          <ReferenceDot
            x={centerSpot}
            y={current.value}
            r={5}
            fill="var(--accent)"
            stroke="var(--surface)"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
