"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import ProductCard from "@/components/structuring/ProductCard";
import ProductDetail from "@/components/structuring/ProductDetail";
import { structuredProducts } from "@/data/structuredProducts";

export default function ProductsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quizMode, setQuizMode] = useState(false);

  const selected = structuredProducts.find((p) => p.id === selectedId) ?? null;
  const others = structuredProducts.filter((p) => p.id !== selectedId);

  return (
    <div>
      <div className="mb-8 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">The two questions</h2>
          <p className="mt-2 leading-relaxed text-foreground/90">
            For every product, answer quickly: <span className="font-semibold">where does the coupon come from</span>,
            and <span className="font-semibold">what is the client short?</span> Usually the client is short a
            down-and-in put, and the coupon is topped up by the issuer&apos;s funding spread. For worst-ofs the client
            is <span className="font-semibold">long correlation</span>: lower correlation makes the coupon richer.
          </p>
        </div>
        <button
          onClick={() => setQuizMode((q) => !q)}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            quizMode
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border bg-surface text-muted-foreground hover:border-accent hover:text-foreground"
          }`}
        >
          {quizMode ? "Quiz mode on" : "Quiz me"}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {selected && (
          <div className="mb-6">
            <ProductDetail product={selected} quizMode={quizMode} onClose={() => setSelectedId(null)} />
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(selected ? others : structuredProducts).map((product) => (
          <ProductCard key={product.id} product={product} onClick={() => setSelectedId(product.id)} />
        ))}
      </div>
    </div>
  );
}
