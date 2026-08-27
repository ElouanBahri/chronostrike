"use client";

import { motion } from "framer-motion";
import type { BlackScholesInputs } from "@/lib/blackScholes";
import type { Strategy } from "@/data/strategies";
import { netAt } from "./StrategyChart";

interface StrategyCardProps {
  strategy: Strategy;
  inputs: BlackScholesInputs;
  onClick: () => void;
}

const categoryColor: Record<Strategy["category"], string> = {
  Bullish: "text-emerald-500",
  Bearish: "text-rose-500",
  Volatility: "text-cosmic",
  "Range-bound": "text-accent",
};

export default function StrategyCard({ strategy, inputs, onClick }: StrategyCardProps) {
  const legStrikes = strategy.legs.map((leg) => inputs.spot * (1 + leg.strikeOffsetPct));
  const { value } = netAt(strategy, legStrikes, inputs, inputs.spot);

  return (
    <motion.button
      layoutId={`strategy-card-${strategy.id}`}
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-5 text-left transition-colors hover:border-accent/50"
    >
      <motion.span
        layoutId={`strategy-badge-${strategy.id}`}
        className={`text-xs font-semibold tracking-wide uppercase ${categoryColor[strategy.category]}`}
      >
        {strategy.category}
      </motion.span>
      <div>
        <div className="font-semibold text-foreground">{strategy.name}</div>
        <p className="mt-1 text-sm text-muted-foreground">{strategy.hook}</p>
      </div>
      <div className="mt-auto pt-2 font-mono text-sm text-foreground">
        {value >= 0 ? "Debit " : "Credit "}
        {Math.abs(value).toLocaleString("en-US", { style: "currency", currency: "USD" })}
      </div>
    </motion.button>
  );
}
