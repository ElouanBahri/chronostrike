"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ControlsPanel, { type ControlsState } from "@/components/ControlsPanel";
import ConceptCard from "@/components/ConceptCard";
import ConceptDetail from "@/components/ConceptDetail";
import { concepts, type MetricKey } from "@/data/concepts";
import type { BlackScholesInputs } from "@/lib/blackScholes";

const initialControls: ControlsState = {
  spot: 100,
  strike: 100,
  daysToExpiry: 90,
  volatilityPct: 25,
  ratePct: 4,
  optionType: "call",
};

export default function Home() {
  const [controls, setControls] = useState<ControlsState>(initialControls);
  const [selectedId, setSelectedId] = useState<MetricKey | null>(null);

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

  const selectedConcept = concepts.find((c) => c.id === selectedId) ?? null;
  const otherConcepts = concepts.filter((c) => c.id !== selectedId);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16 sm:py-24">
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Equity options, explained live
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">ChronoStrike</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground text-balance">
          Click a card, then drag the controls below — every chart redraws instantly, so you can feel how
          price, delta, gamma, theta, vega, and rho actually behave.
        </p>
      </motion.header>

      <div className="mb-8">
        <ControlsPanel state={controls} onChange={setControls} />
      </div>

      <AnimatePresence mode="wait">
        {selectedConcept && (
          <div className="mb-6">
            <ConceptDetail
              concept={selectedConcept}
              inputs={inputs}
              optionType={controls.optionType}
              onClose={() => setSelectedId(null)}
            />
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {(selectedConcept ? otherConcepts : concepts).map((concept) => (
          <ConceptCard
            key={concept.id}
            concept={concept}
            inputs={inputs}
            optionType={controls.optionType}
            isSelected={false}
            onClick={() => setSelectedId(concept.id)}
          />
        ))}
      </div>
    </main>
  );
}
