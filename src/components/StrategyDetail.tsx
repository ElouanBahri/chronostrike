"use client";

import { motion } from "framer-motion";
import type { BlackScholesInputs } from "@/lib/blackScholes";
import type { Strategy } from "@/data/strategies";
import StrategyChart from "./StrategyChart";

interface StrategyDetailProps {
  strategy: Strategy;
  inputs: BlackScholesInputs;
  onClose: () => void;
}

export default function StrategyDetail({ strategy, inputs, onClose }: StrategyDetailProps) {
  // Butterfly has two identical short-call legs at the same strike; collapse them
  // for the leg readout so it reads "Short 2x ATM Call" instead of two rows.
  const legLabels = strategy.legs.map((leg) => leg.label).filter(Boolean);

  return (
    <motion.div
      layoutId={`strategy-card-${strategy.id}`}
      className="rounded-2xl border border-accent bg-accent-soft p-6 sm:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <motion.span
            layoutId={`strategy-badge-${strategy.id}`}
            className="text-xs font-semibold tracking-wide text-accent uppercase"
          >
            {strategy.category}
          </motion.span>
          <h2 className="mt-1 text-2xl font-semibold text-foreground">{strategy.name}</h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
        >
          Close
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {legLabels.map((label) => (
          <span
            key={label}
            className="rounded-full border border-border bg-background/40 px-3 py-1 text-xs font-medium text-muted-foreground"
          >
            {label}
          </span>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mt-5 max-w-2xl leading-relaxed text-foreground/90"
      >
        {strategy.whyHow}
      </motion.p>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-6">
        <div className="mb-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-accent" /> Theoretical value today
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full border border-dashed border-cosmic" /> Payoff at expiry
          </span>
        </div>
        <StrategyChart strategy={strategy} inputs={inputs} />
      </motion.div>
    </motion.div>
  );
}
