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
import { computeGreeks, price } from "@/lib/blackScholes";
import type { Concept } from "@/data/concepts";

interface GreekChartProps {
  concept: Concept;
  inputs: BlackScholesInputs;
  optionType: OptionType;
}

const POINTS = 60;

function payoffAtExpiry(spot: number, strike: number, type: OptionType): number {
  return type === "call" ? Math.max(spot - strike, 0) : Math.max(strike - spot, 0);
}

export default function GreekChart({ concept, inputs, optionType }: GreekChartProps) {
  const center = inputs.strike;
  const minSpot = Math.max(center * 0.4, 1);
  const maxSpot = center * 1.6;
  const step = (maxSpot - minSpot) / POINTS;

  const data = Array.from({ length: POINTS + 1 }, (_, i) => {
    const spot = minSpot + step * i;
    const pointInputs: BlackScholesInputs = { ...inputs, spot };
    const greeks = computeGreeks(pointInputs, optionType);
    const value = greeks[concept.id];
    return concept.kind === "price"
      ? { spot, value, payoff: payoffAtExpiry(spot, inputs.strike, optionType) }
      : { spot, value };
  });

  const currentValue =
    concept.kind === "price" ? price(inputs, optionType) : computeGreeks(inputs, optionType)[concept.id];

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
            formatter={(value) => Number(value).toFixed(4)}
            labelFormatter={(spot) => `Spot: $${Number(spot).toFixed(2)}`}
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border-color)",
              borderRadius: 8,
              color: "var(--foreground)",
            }}
          />
          <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2.5} dot={false} />
          {concept.kind === "price" && (
            <Line
              type="monotone"
              dataKey="payoff"
              stroke="var(--cosmic)"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              dot={false}
            />
          )}
          <ReferenceDot
            x={inputs.spot}
            y={currentValue}
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
