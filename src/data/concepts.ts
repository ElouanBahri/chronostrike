export type ConceptKind = "price" | "greek";
export type MetricKey = "price" | "delta" | "gamma" | "theta" | "vega" | "rho";

export interface Concept {
  id: MetricKey;
  symbol: string;
  name: string;
  kind: ConceptKind;
  /** True if calls and puts genuinely differ for this metric (affects the chart legend/toggle). */
  varysByType: boolean;
  hook: string;
  definition: string;
  unit: string;
}

export const concepts: Concept[] = [
  {
    id: "price",
    symbol: "$",
    name: "Option Price",
    kind: "price",
    varysByType: true,
    hook: "What the option itself is worth today.",
    definition:
      "The Black-Scholes fair value of the option — what you'd theoretically pay (or receive) for it today, given the underlying price, strike, time left, volatility, and interest rate. As expiry approaches, this curve collapses onto the payoff diagram: the kinked line showing what the option is worth at expiry, with no time value left.",
    unit: "$ per share",
  },
  {
    id: "delta",
    symbol: "Δ",
    name: "Delta",
    kind: "greek",
    varysByType: true,
    hook: "How much the option's price moves per $1 move in the stock.",
    definition:
      "Delta measures the option's sensitivity to the underlying price. A call's delta ranges from 0 (deep out-of-the-money) to 1 (deep in-the-money); a put's ranges from -1 to 0. It's also commonly read as an approximate probability the option finishes in-the-money, and as the number of shares you'd need to hold to hedge one option contract.",
    unit: "$ per $1 move in spot",
  },
  {
    id: "gamma",
    symbol: "Γ",
    name: "Gamma",
    kind: "greek",
    varysByType: false,
    hook: "How fast delta itself changes as the stock moves.",
    definition:
      "Gamma is the rate of change of delta — the option's 'acceleration.' It's identical for a call and a put at the same strike (put-call parity). Gamma peaks for at-the-money options close to expiry, which is exactly when a hedged position becomes hardest to keep balanced: delta can swing violently on small moves in the stock.",
    unit: "Δ change per $1 move in spot",
  },
  {
    id: "theta",
    symbol: "Θ",
    name: "Theta",
    kind: "greek",
    varysByType: true,
    hook: "How much value the option loses every day, all else equal.",
    definition:
      "Theta is time decay — the daily erosion of an option's extrinsic (time) value as expiry approaches, holding everything else fixed. It's usually negative for a long option (you're paying for time) and is the namesake concept behind this project: Chronos, time itself, steadily working against the option buyer.",
    unit: "$ per day",
  },
  {
    id: "vega",
    symbol: "ν",
    name: "Vega",
    kind: "greek",
    varysByType: false,
    hook: "How much the option's price moves per 1-point change in implied volatility.",
    definition:
      "Vega measures sensitivity to volatility (not an actual Greek letter, borrowed for the family). Options are bets on how much the underlying will move, so a rise in implied volatility raises both call and put prices — vega is identical for calls and puts at the same strike, and is largest for at-the-money options with plenty of time left.",
    unit: "$ per 1pt change in IV",
  },
  {
    id: "rho",
    symbol: "ρ",
    name: "Rho",
    kind: "greek",
    varysByType: true,
    hook: "How much the option's price moves per 1-point change in interest rates.",
    definition:
      "Rho measures sensitivity to the risk-free interest rate. It's usually the smallest of the Greeks in practice and matters most for long-dated options (LEAPS): higher rates raise call values and lower put values, since the strike's present value shifts with the discount rate.",
    unit: "$ per 1pt change in rates",
  },
];
