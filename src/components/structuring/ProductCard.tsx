"use client";

import { motion } from "framer-motion";
import type { ProductFamily, StructuredProduct } from "@/data/structuredProducts";

export const familyColor: Record<ProductFamily, string> = {
  Autocallable: "text-accent",
  "Reverse convertible": "text-rose-500",
  "Principal protected": "text-emerald-500",
  "Buffered & leveraged": "text-cosmic",
  "Index-linked": "text-sky-500",
};

interface ProductCardProps {
  product: StructuredProduct;
  onClick: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <motion.button
      layoutId={`product-card-${product.id}`}
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-5 text-left transition-colors hover:border-accent/50"
    >
      <motion.span
        layoutId={`product-badge-${product.id}`}
        className={`text-xs font-semibold tracking-wide uppercase ${familyColor[product.family]}`}
      >
        {product.family}
      </motion.span>
      <div>
        <div className="font-semibold text-foreground">{product.name}</div>
        <p className="mt-1 text-sm text-muted-foreground">{product.hook}</p>
      </div>
      <div className="mt-auto pt-2 text-xs font-medium text-muted-foreground">{product.vega}</div>
    </motion.button>
  );
}
