"use client";

import { motion } from "framer-motion";
import type { BlackScholesInputs, OptionType } from "@/lib/blackScholes";
import { computeGreeks, price } from "@/lib/blackScholes";
import type { Concept } from "@/data/concepts";

interface ConceptCardProps {
  concept: Concept;
  inputs: BlackScholesInputs;
  optionType: OptionType;
  isSelected: boolean;
  onClick: () => void;
}

export default function ConceptCard({ concept, inputs, optionType, isSelected, onClick }: ConceptCardProps) {
  const value = concept.kind === "price" ? price(inputs, optionType) : computeGreeks(inputs, optionType)[concept.id];

  return (
    <motion.button
      layoutId={`card-${concept.id}`}
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      className={`flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-colors ${
        isSelected
          ? "border-accent bg-accent-soft"
          : "border-border bg-surface hover:border-accent/50"
      }`}
    >
      <motion.span layoutId={`symbol-${concept.id}`} className="text-3xl font-semibold text-accent">
        {concept.symbol}
      </motion.span>
      <div>
        <div className="font-semibold text-foreground">{concept.name}</div>
        <p className="mt-1 text-sm text-muted-foreground">{concept.hook}</p>
      </div>
      <div className="mt-auto pt-2 font-mono text-sm text-foreground">
        {value.toLocaleString(undefined, { maximumFractionDigits: 4 })}
      </div>
    </motion.button>
  );
}
