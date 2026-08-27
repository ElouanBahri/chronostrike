"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import ControlsPanel, { type ControlsState } from "@/components/ControlsPanel";
import StrategyCard from "@/components/StrategyCard";
import StrategyDetail from "@/components/StrategyDetail";
import { strategies } from "@/data/strategies";
import type { BlackScholesInputs } from "@/lib/blackScholes";

const initialControls: ControlsState = {
  spot: 100,
  strike: 100,
  daysToExpiry: 45,
  volatilityPct: 25,
  ratePct: 4,
  optionType: "call",
};

export default function StrategiesPage() {
  const [controls, setControls] = useState<ControlsState>(initialControls);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const inputs: BlackScholesInputs = useMemo(
    () => ({
      spot: controls.spot,
      strike: controls.strike,
      timeToExpiry: controls.daysToExpiry / 365,
      volatility: controls.volatilityPct / 100,
      rate: controls.ratePct / 100,
    }),
    [controls]
  );

  const selectedStrategy = strategies.find((s) => s.id === selectedId) ?? null;
  const otherStrategies = strategies.filter((s) => s.id !== selectedId);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:py-14">
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Multi-leg strategies, explained live
        </p>
        <div className="flex items-center gap-4">
          <Image src="/logo-mark.png" alt="" width={72} height={67} className="h-14 w-auto sm:h-16" priority />
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Strategies</h1>
        </div>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground text-balance">
          Combinations of calls and puts traders use for a specific view — directional with capped risk,
          a pure bet on volatility, or betting the stock stays in a range. Strikes are shown relative to
          the underlying price below.
        </p>
      </motion.header>

      <div className="mb-8">
        <ControlsPanel state={controls} onChange={setControls} hideStrike hideOptionTypeToggle />
      </div>

      <AnimatePresence mode="wait">
        {selectedStrategy && (
          <div className="mb-6">
            <StrategyDetail strategy={selectedStrategy} inputs={inputs} onClose={() => setSelectedId(null)} />
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(selectedStrategy ? otherStrategies : strategies).map((strategy) => (
          <StrategyCard
            key={strategy.id}
            strategy={strategy}
            inputs={inputs}
            onClick={() => setSelectedId(strategy.id)}
          />
        ))}
      </div>
    </main>
  );
}
