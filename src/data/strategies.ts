import type { OptionType } from "@/lib/blackScholes";

export type StrategyCategory = "Bullish" | "Bearish" | "Volatility" | "Range-bound";

export interface StrategyLeg {
  type: OptionType;
  position: "long" | "short";
  /** Strike expressed relative to spot, e.g. -0.05 = 5% below spot. */
  strikeOffsetPct: number;
  label: string;
}

export interface Strategy {
  id: string;
  name: string;
  category: StrategyCategory;
  hook: string;
  whyHow: string;
  legs: StrategyLeg[];
}

export const strategies: Strategy[] = [
  {
    id: "bull-call-spread",
    name: "Bull Call Spread",
    category: "Bullish",
    hook: "A cheaper, capped bet that the stock goes up.",
    whyHow:
      "Buy a call near the money and sell a further out-of-the-money call against it. Selling the higher-strike call collects premium that offsets the cost of the long call, lowering the breakeven versus a naked call purchase — the trade-off is giving up any gain above the short strike. Used when you're moderately (not explosively) bullish and want to reduce the cost of the bet. Max loss is the net premium paid; max profit is the strike width minus that premium.",
    legs: [
      { type: "call", position: "long", strikeOffsetPct: 0, label: "Long ATM Call" },
      { type: "call", position: "short", strikeOffsetPct: 0.1, label: "Short 110% Call" },
    ],
  },
  {
    id: "bear-put-spread",
    name: "Bear Put Spread",
    category: "Bearish",
    hook: "A cheaper, capped bet that the stock goes down.",
    whyHow:
      "The mirror image of a bull call spread: buy a put near the money and sell a further out-of-the-money put against it. The short put's premium lowers your cost basis in exchange for capping the profit below the short strike. Used when you expect a moderate decline and want cheaper downside exposure than an outright put. Max loss is the net premium paid; max profit is the strike width minus that premium.",
    legs: [
      { type: "put", position: "long", strikeOffsetPct: 0, label: "Long ATM Put" },
      { type: "put", position: "short", strikeOffsetPct: -0.1, label: "Short 90% Put" },
    ],
  },
  {
    id: "straddle",
    name: "Long Straddle",
    category: "Volatility",
    hook: "A pure bet that the stock moves a lot — in either direction.",
    whyHow:
      "Buy a call and a put at the same (typically at-the-money) strike. You profit if the stock makes a big move either way — past an earnings release or other binary event, for instance — and lose if it sits still, since both legs decay via theta. It's a direct long-vega, long-gamma position: you're betting realized volatility comes in higher than what you paid for in implied volatility, with no directional view at all.",
    legs: [
      { type: "call", position: "long", strikeOffsetPct: 0, label: "Long ATM Call" },
      { type: "put", position: "long", strikeOffsetPct: 0, label: "Long ATM Put" },
    ],
  },
  {
    id: "butterfly",
    name: "Long Call Butterfly",
    category: "Range-bound",
    hook: "A cheap bet that the stock lands near a specific price by expiry.",
    whyHow:
      "Buy one lower-strike call, sell two middle-strike calls, buy one higher-strike call (equally spaced). It's the opposite of a straddle: maximum profit sits right at the middle strike, and the cost is small because the two short calls fund most of the two long calls. Used when you expect the stock to pin near a specific level (e.g. a strike with heavy open interest, or simply a range-bound stock) — you're effectively short volatility with strictly limited risk on both sides.",
    legs: [
      { type: "call", position: "long", strikeOffsetPct: -0.1, label: "Long 90% Call" },
      { type: "call", position: "short", strikeOffsetPct: 0, label: "Short 2x ATM Call" },
      { type: "call", position: "short", strikeOffsetPct: 0, label: "" },
      { type: "call", position: "long", strikeOffsetPct: 0.1, label: "Long 110% Call" },
    ],
  },
  {
    id: "iron-condor",
    name: "Iron Condor",
    category: "Range-bound",
    hook: "Collect premium betting the stock stays inside a range.",
    whyHow:
      "Sell an out-of-the-money put spread and an out-of-the-money call spread simultaneously (four legs, all same expiry). You collect net premium up front and keep all of it if the stock stays between the two short strikes through expiry — the long wings cap your risk if it breaks out either way. It's the classic 'sell volatility' income trade for a stock you expect to stay range-bound, trading a high win rate for a limited-but-real max loss if the range breaks.",
    legs: [
      { type: "put", position: "long", strikeOffsetPct: -0.2, label: "Long 80% Put" },
      { type: "put", position: "short", strikeOffsetPct: -0.1, label: "Short 90% Put" },
      { type: "call", position: "short", strikeOffsetPct: 0.1, label: "Short 110% Call" },
      { type: "call", position: "long", strikeOffsetPct: 0.2, label: "Long 120% Call" },
    ],
  },
];
