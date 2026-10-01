"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { StructuredProduct } from "@/data/structuredProducts";
import PayoffChart from "./PayoffChart";
import { familyColor } from "./ProductCard";

interface ProductDetailProps {
  product: StructuredProduct;
  quizMode: boolean;
  onClose: () => void;
}

function Answer({ question, answer, hidden }: { question: string; answer: string; hidden: boolean }) {
  const [revealed, setRevealed] = useState(false);
  const show = !hidden || revealed;

  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <div className="mb-1.5 text-xs font-semibold tracking-wide text-accent uppercase">{question}</div>
      {show ? (
        <p className="text-sm leading-relaxed text-foreground/90">{answer}</p>
      ) : (
        <button
          onClick={() => setRevealed(true)}
          className="mt-1 rounded-full border border-dashed border-accent/60 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
        >
          Answer in your head, then reveal
        </button>
      )}
    </div>
  );
}

export default function ProductDetail({ product, quizMode, onClose }: ProductDetailProps) {
  return (
    <motion.div
      layoutId={`product-card-${product.id}`}
      className="rounded-2xl border border-accent bg-accent-soft p-6 sm:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <motion.span
            layoutId={`product-badge-${product.id}`}
            className={`text-xs font-semibold tracking-wide uppercase ${familyColor[product.family]}`}
          >
            {product.family}
          </motion.span>
          <h2 className="mt-1 text-2xl font-semibold text-foreground">{product.name}</h2>
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
        className="mt-5 max-w-3xl leading-relaxed text-foreground/90"
      >
        {product.mechanics}
      </motion.p>

      {/* Remount on product change so quiz reveals reset. */}
      <div key={product.id} className="mt-6 grid gap-3 sm:grid-cols-2">
        <Answer question="Where does the coupon come from?" answer={product.couponSource} hidden={quizMode} />
        <Answer question="What is the client short?" answer={product.clientShort} hidden={quizMode} />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-6 grid gap-6 lg:grid-cols-[1fr_18rem]"
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full bg-accent" /> Note pays at maturity
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full border border-dashed border-cosmic" /> Holding the stock
            </span>
          </div>
          <PayoffChart payoff={product.payoff} />
          <p className="mt-2 text-xs text-muted-foreground">
            x-axis: final level as % of initial. {product.payoffNote} Assumes the note wasn&apos;t called early;
            stock line excludes dividends.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Client&apos;s replicating portfolio
            </h3>
            <ul className="space-y-1.5 text-sm text-foreground/90">
              {product.decomposition.map((leg) => (
                <li key={leg} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                  {leg}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Terms get richer when
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {product.richerWhen.map((move) => (
                <span
                  key={move}
                  className="rounded-full border border-border bg-background/40 px-2.5 py-1 font-mono text-xs text-foreground"
                >
                  {move}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Client is {product.vega.toLowerCase()}.</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
