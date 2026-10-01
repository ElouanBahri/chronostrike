"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { sampleTermSheet, type FieldTag } from "@/data/termSheet";

const tagColor: Record<FieldTag, string> = {
  Payoff: "text-accent",
  Barriers: "text-rose-500",
  Dates: "text-sky-500",
  Valuation: "text-emerald-500",
  Risk: "text-cosmic",
};

export default function AnnotatedTermSheet() {
  const [selectedId, setSelectedId] = useState(sampleTermSheet.fields[0].id);
  const selected = sampleTermSheet.fields.find((f) => f.id === selectedId) ?? sampleTermSheet.fields[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="mb-1 text-xs font-medium text-muted-foreground">Illustrative pricing supplement · fictional issuer & numbers</div>
        <h3 className="mb-4 font-semibold leading-snug text-foreground">{sampleTermSheet.title}</h3>
        <dl className="divide-y divide-border">
          {sampleTermSheet.fields.map((field) => {
            const isActive = field.id === selected.id;
            return (
              <button
                key={field.id}
                onClick={() => setSelectedId(field.id)}
                className={`grid w-full gap-1 px-2 py-2.5 text-left text-sm transition-colors sm:grid-cols-[11rem_1fr] sm:gap-4 ${
                  isActive ? "rounded-lg bg-accent-soft" : "hover:bg-background/60"
                }`}
              >
                <dt className="flex items-center gap-2 font-medium text-foreground">
                  <span className={`text-[10px] font-semibold tracking-wide uppercase ${tagColor[field.tag]}`}>
                    {field.tag}
                  </span>
                </dt>
                <dd className="text-foreground/90">
                  <span className="font-medium">{field.label}: </span>
                  <span className="text-muted-foreground">{field.value}</span>
                </dd>
              </button>
            );
          })}
        </dl>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <AnimatePresence mode="wait">
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="rounded-2xl border border-accent bg-accent-soft p-5"
          >
            <span className={`text-xs font-semibold tracking-wide uppercase ${tagColor[selected.tag]}`}>
              {selected.tag}
            </span>
            <h4 className="mt-1 font-semibold text-foreground">{selected.label}</h4>
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">{selected.explain}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
