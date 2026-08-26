"use client";

import { motion } from "framer-motion";
import type { BlackScholesInputs, OptionType } from "@/lib/blackScholes";
import type { Concept } from "@/data/concepts";
import GreekChart from "./GreekChart";

interface ConceptDetailProps {
  concept: Concept;
  inputs: BlackScholesInputs;
  optionType: OptionType;
  onClose: () => void;
}

export default function ConceptDetail({ concept, inputs, optionType, onClose }: ConceptDetailProps) {
  return (
    <motion.div
      layoutId={`card-${concept.id}`}
      className="rounded-2xl border border-accent bg-accent-soft p-6 sm:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <motion.span layoutId={`symbol-${concept.id}`} className="text-5xl font-semibold text-accent">
            {concept.symbol}
          </motion.span>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{concept.name}</h2>
            <p className="text-sm text-muted-foreground">{concept.unit}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
        >
          Close
        </button>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mt-5 max-w-2xl leading-relaxed text-foreground/90"
      >
        {concept.definition}
      </motion.p>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-6">
        <div className="mb-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-accent" /> {concept.name}
            {concept.varysByType ? ` (${optionType})` : ""}
          </span>
          {concept.kind === "price" && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full border border-dashed border-cosmic" /> Payoff at expiry
            </span>
          )}
        </div>
        <GreekChart concept={concept} inputs={inputs} optionType={optionType} />
      </motion.div>
    </motion.div>
  );
}
