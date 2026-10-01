import { Suspense } from "react";
import type { Metadata } from "next";
import AutocallPricer from "@/components/structuring/AutocallPricer";

export const metadata: Metadata = {
  title: "Build a pricer · ChronoStrike",
};

export default function PricerPage() {
  return (
    <div>
      <div className="mb-6 max-w-3xl">
        <h2 className="text-xl font-semibold text-foreground">Worst-of autocallable, Monte Carlo</h2>
        <p className="mt-1 text-muted-foreground">
          The project worth building: price a worst-of autocall on 2–3 underlyings, get the fair coupon and its
          sensitivities, and watch how it moves with the barrier and correlation. Everything below runs live in your
          browser. The Python version at the bottom is the one to rebuild yourself.
        </p>
      </div>
      {/* useSearchParams (terms passed from the term-sheet worksheet) needs a Suspense boundary. */}
      <Suspense fallback={<div className="h-96 rounded-2xl border border-border bg-surface" />}>
        <AutocallPricer />
      </Suspense>
    </div>
  );
}
