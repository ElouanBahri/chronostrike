export type ProductFamily =
  | "Autocallable"
  | "Reverse convertible"
  | "Principal protected"
  | "Buffered & leveraged"
  | "Index-linked";

export interface StructuredProduct {
  id: string;
  name: string;
  family: ProductFamily;
  hook: string;
  /** How it works, in plain words. */
  mechanics: string;
  /** The two questions you should answer in seconds. */
  couponSource: string;
  clientShort: string;
  /** Replicating portfolio from the client's point of view. */
  decomposition: string[];
  /** Client's volatility position. */
  vega: "Short vol" | "Long vol" | "Mixed (skew-driven)";
  /** Market moves that make the terms (coupon, participation, cap) richer at launch. */
  richerWhen: string[];
  /** Total paid at maturity (% of notional) vs final performance of the (worst) underlying, assuming no earlier call. */
  payoff: (perf: number) => number;
  payoffNote: string;
}

const COUPON_PA = 10;

export const structuredProducts: StructuredProduct[] = [
  {
    id: "phoenix",
    name: "Phoenix Autocallable",
    family: "Autocallable",
    hook: "Contingent coupons, early redemption if the stock is up, capital at risk below a barrier.",
    mechanics:
      "On each observation date: if the underlying is at or above the coupon barrier (say 70%), the note pays that period's coupon. If it's at or above the autocall trigger (usually 100%), the note is called — par plus coupon, game over. If it survives to maturity, the client gets par back unless the underlying is below the downside threshold (say 60%), in which case they take the full loss from 100%, not just the part below 60%.",
    couponSource:
      "Mostly the premium of the down-and-in put the client sells, plus the issuer's funding spread (the issuer borrows at r + spread, and passes that spread through as coupon). The contingent feature adds a little more: the client also sells digitals that switch the coupon off below the coupon barrier.",
    clientShort:
      "A down-and-in put on the underlying (strike 100%, barrier at the downside threshold), plus coupon digitals. The autocall shortens the trade exactly when markets are good, so the client also gives up the long coupon stream in the best scenarios.",
    decomposition: [
      "Long zero-coupon bond of the issuer (credit risk on the issuer)",
      "Short down-and-in put — K = 100%, B = 60%",
      "Long strip of digitals paying the coupon when S ≥ 70%",
      "Autocall: the whole package terminates at par when S ≥ 100%",
    ],
    vega: "Short vol",
    richerWhen: ["Vol ↑", "Dividends ↑", "Rates ↑", "Funding spread ↑"],
    payoff: (p) => (p >= 0.6 ? 100 : 100 * p) + (p >= 0.7 ? COUPON_PA / 4 : 0),
    payoffNote: "Last quarterly coupon (2.5%) paid above 70%; principal at risk below 60%.",
  },
  {
    id: "snowball",
    name: "Snowball Autocallable",
    family: "Autocallable",
    hook: "Coupons accumulate silently and are paid in one lump when the note calls.",
    mechanics:
      "No running coupons. Instead, each period adds a coupon to a 'snowball' that is paid only when the note autocalls (or at maturity, if the underlying is above the trigger). Called after 3 years at 10% p.a.? You get par + 30%. Never called and below the barrier? You get the stock's loss and nothing else.",
    couponSource:
      "Same as the Phoenix — the short down-and-in put plus funding — but the coupon looks bigger because it is only paid in good states. You're effectively selling the coupons in the bad states back to the issuer.",
    clientShort:
      "A down-and-in put, and the coupons themselves in every scenario where the note isn't called. The client is very short the 'stock drifts sideways-down' scenario.",
    decomposition: [
      "Long zero-coupon bond of the issuer",
      "Short down-and-in put — K = 100%, B = 60%",
      "Long digitals paying k × coupon if first called on date k",
    ],
    vega: "Short vol",
    richerWhen: ["Vol ↑", "Dividends ↑", "Rates ↑", "Funding spread ↑"],
    payoff: (p) => (p >= 1 ? 100 + 3 * COUPON_PA : p >= 0.6 ? 100 : 100 * p),
    payoffNote: "3-year note at 10% p.a.: par + 30% if the final level is above 100%.",
  },
  {
    id: "memory",
    name: "Memory Coupon Autocallable",
    family: "Autocallable",
    hook: "A Phoenix where missed coupons are paid later if the stock recovers.",
    mechanics:
      "Like a Phoenix, but if a coupon is skipped because the underlying is below the coupon barrier, it is 'remembered'. The next time the underlying is back above the barrier, the client receives all missed coupons at once.",
    couponSource:
      "The same short down-and-in put and funding spread. Memory makes the coupon strip more valuable to the client, so for the same option premium the headline coupon must be lower than the equivalent Phoenix.",
    clientShort:
      "A down-and-in put. The memory feature is something the client is long — they pay for it through a lower coupon rate.",
    decomposition: [
      "Long zero-coupon bond of the issuer",
      "Short down-and-in put — K = 100%, B = 60%",
      "Long path-dependent coupon strip (with catch-up)",
      "Autocall at 100%",
    ],
    vega: "Short vol",
    richerWhen: ["Vol ↑", "Dividends ↑", "Rates ↑", "Funding spread ↑"],
    payoff: (p) => (p >= 0.6 ? 100 : 100 * p) + (p >= 0.7 ? 4 * (COUPON_PA / 4) : 0),
    payoffNote: "Example: the last 3 coupons were missed, so the final date pays 4 × 2.5% if above 70%.",
  },
  {
    id: "worst-of",
    name: "Worst-of Autocallable",
    family: "Autocallable",
    hook: "Same payoff, but on the worst of 2–3 underlyings. Higher coupon, more ways to lose.",
    mechanics:
      "Every test — coupon, autocall, downside threshold — uses whichever underlying has performed worst since inception. US wealth flow is dominated by worst-ofs on indices (SPX / RTY / NDX) and single stocks. One bad name is enough to switch coupons off or breach the barrier.",
    couponSource:
      "A much richer put: the client sells a down-and-in put on the worst of the basket, which is worth more than a put on any single name. Plus the funding spread. Lower correlation means the names diverge more, the worst-of falls further, the put is worth more — and the coupon goes up.",
    clientShort:
      "A down-and-in put on the worst-of, and dispersion. The client is LONG correlation: if the names move together, the worst-of behaves like a single stock and the put is cheaper. The desk ends up short correlation — the classic structured products 'correlation axe'.",
    decomposition: [
      "Long zero-coupon bond of the issuer",
      "Short worst-of down-and-in put — K = 100%, B = 60%",
      "Long worst-of coupon digitals",
      "Autocall on the worst-of at 100%",
    ],
    vega: "Short vol",
    richerWhen: ["Vol ↑", "Correlation ↓", "Dividends ↑", "Rates ↑", "Funding spread ↑"],
    payoff: (p) => (p >= 0.6 ? 100 : 100 * p) + (p >= 0.7 ? COUPON_PA / 4 : 0),
    payoffNote: "x-axis is the worst performer. Try the pricer to see what correlation does to the coupon.",
  },
  {
    id: "reverse-convertible",
    name: "Reverse Convertible",
    family: "Reverse convertible",
    hook: "A fixed, high coupon — and you may end up owning the stock.",
    mechanics:
      "Pays a fixed coupon no matter what. At maturity: if the stock is above the strike (usually 100%), par back. If it's below, the client receives the stock (or its cash value), taking the full loss. The coupon is the price of insurance the client wrote.",
    couponSource:
      "Entirely the premium of an at-the-money put the client sells, plus the funding spread. With no barrier, the put is expensive, so the coupon is high.",
    clientShort: "A vanilla put struck at 100% — the client is a put writer with a bond attached.",
    decomposition: ["Long zero-coupon bond of the issuer", "Short vanilla put — K = 100%"],
    vega: "Short vol",
    richerWhen: ["Vol ↑", "Dividends ↑", "Rates ↑", "Funding spread ↑"],
    payoff: (p) => Math.min(100, 100 * p) + 12,
    payoffNote: "1-year note, 12% fixed coupon, no barrier.",
  },
  {
    id: "barrier-reverse-convertible",
    name: "Barrier Reverse Convertible",
    family: "Reverse convertible",
    hook: "A reverse convertible with a cushion: losses only kick in below a barrier.",
    mechanics:
      "Fixed coupon. Par back at maturity unless the stock has breached the barrier (say 70%) — then the client takes the full loss from 100%. US notes usually test the barrier only at maturity (European); many European notes test it daily (American), which is worse for the client.",
    couponSource:
      "The premium of a down-and-in put, which is cheaper than the vanilla put — so the coupon is lower than a plain reverse convertible. Plus funding.",
    clientShort:
      "A down-and-in put (K = 100%, B = 70%). Near the barrier the client is wildly short gamma: a small move across 70% switches a 30% loss on or off.",
    decomposition: ["Long zero-coupon bond of the issuer", "Short down-and-in put — K = 100%, B = 70%"],
    vega: "Short vol",
    richerWhen: ["Vol ↑", "Dividends ↑", "Rates ↑", "Funding spread ↑"],
    payoff: (p) => (p >= 0.7 ? 100 : 100 * p) + 8,
    payoffNote: "1-year note, 8% fixed coupon, European barrier at 70%.",
  },
  {
    id: "ppn",
    name: "Principal-Protected Note",
    family: "Principal protected",
    hook: "Par back at maturity, plus a share of the upside.",
    mechanics:
      "The issuer invests most of the notional in a zero-coupon bond that grows back to par by maturity. The leftover (minus fees) buys an at-the-money call. Participation = leftover ÷ call price. Higher rates and higher funding spread mean a cheaper zero, more left over, and higher participation.",
    couponSource:
      "There's no coupon — the 'yield' is the call. The budget for it comes from rates and the issuer's funding spread (the discount on the zero-coupon bond).",
    clientShort:
      "Nothing optional — the client is long a call. They're short the issuer's credit (principal protection is only as good as the issuer) and short the opportunity cost of the interest they gave up.",
    decomposition: ["Long zero-coupon bond of the issuer (≈ 88% today for 5y)", "Long ATM call × participation"],
    vega: "Long vol",
    richerWhen: ["Vol ↓", "Dividends ↑", "Rates ↑", "Funding spread ↑"],
    payoff: (p) => 100 + 80 * Math.max(p - 1, 0),
    payoffNote: "100% protection, 80% participation in the upside.",
  },
  {
    id: "buffered",
    name: "Buffered Note",
    family: "Buffered & leveraged",
    hook: "The first 10% of losses are absorbed; the upside is capped.",
    mechanics:
      "Upside 1:1 up to a cap (say +15%). Between 0% and −10%, par back. Below −10%, the client loses 1:1 beyond the buffer — a final level of 75% returns 85%.",
    couponSource:
      "No coupon. The buffer is a put spread the client is long, paid for by selling the upside above the cap (a call).",
    clientShort:
      "A call struck at the cap and a put struck at the buffer level (90%). They're long the underlying via the forward and long the 100% put.",
    decomposition: [
      "Long zero-coupon bond + long forward on the underlying",
      "Long put K = 100%, short put K = 90% (the buffer)",
      "Short call K = 115% (the cap)",
    ],
    vega: "Mixed (skew-driven)",
    richerWhen: ["Dividends ↑", "Rates ↑", "Funding spread ↑"],
    payoff: (p) => (p >= 1 ? 100 + 100 * Math.min(p - 1, 0.15) : p >= 0.9 ? 100 : 100 + 100 * (p - 0.9)),
    payoffNote: "15% cap, 10% buffer.",
  },
  {
    id: "leveraged",
    name: "Leveraged (Accelerated Return) Note",
    family: "Buffered & leveraged",
    hook: "2× the upside up to a cap, 1× the downside.",
    mechanics:
      "If the underlying rises, the client gets 2× the return, up to a maximum (say +20%, reached at +10% in the stock). If it falls, they lose 1:1, like owning the stock.",
    couponSource:
      "The extra call they're long (the leverage) is paid for by selling calls at the cap. Dividends also help: the client gives them up.",
    clientShort: "Two calls at the cap level (110%), and the dividends on the underlying.",
    decomposition: [
      "Long zero-coupon bond + long forward (1× the stock)",
      "Long 1 extra ATM call (the 2nd unit of upside)",
      "Short 2 calls K = 110% (the cap)",
    ],
    vega: "Mixed (skew-driven)",
    richerWhen: ["Dividends ↑", "Rates ↑", "Funding spread ↑"],
    payoff: (p) => (p >= 1 ? 100 + 200 * Math.min(p - 1, 0.1) : 100 * p),
    payoffNote: "2× leverage, capped at +20%.",
  },
  {
    id: "digital",
    name: "Digital / Trigger Note",
    family: "Buffered & leveraged",
    hook: "A fixed return if the stock finishes above a trigger, 1:1 loss below it.",
    mechanics:
      "If the final level is at or above the trigger (say 80%), the client gets par plus a fixed digital return (say 8%) — even if the stock fell 15%. Below the trigger, they lose 1:1 from 100%.",
    couponSource: "The digital return is funded by the European down-and-in put the client sells (barrier = trigger), plus funding.",
    clientShort:
      "A down-and-in put with a European barrier at 80%. They're long a cash-or-nothing digital paying 8% above 80%.",
    decomposition: [
      "Long zero-coupon bond of the issuer",
      "Long digital — pays 8% if S ≥ 80%",
      "Short down-and-in put — K = 100%, B = 80% (European)",
    ],
    vega: "Short vol",
    richerWhen: ["Vol ↑", "Dividends ↑", "Rates ↑", "Funding spread ↑"],
    payoff: (p) => (p >= 0.8 ? 108 : 100 * p),
    payoffNote: "8% digital return, 80% trigger.",
  },
  {
    id: "qis",
    name: "Index-linked Note on a QIS / proprietary index",
    family: "Index-linked",
    hook: "Protected or levered exposure to a rules-based index built by the bank.",
    mechanics:
      "The underlying isn't SPX — it's a quantitative investment strategy (QIS) index: momentum, carry, risk-premia, or a volatility-target overlay on an equity index with a synthetic dividend ('decrement') deducted each year. Usually wrapped as a PPN or a leveraged note.",
    couponSource:
      "Cheap options. A 5%-vol-target index has a low, stable implied vol, so calls on it are cheap — participation can exceed 100%. The decrement lowers the index's forward, making calls even cheaper. The bank also earns the index fees.",
    clientShort:
      "The decrement and embedded fees (a guaranteed drag every year), the issuer's credit, and the vol-control mechanics (the index de-levers after shocks, so it may miss rebounds).",
    decomposition: [
      "Long zero-coupon bond of the issuer",
      "Long call on the QIS index × participation (often > 100%)",
      "Index rules: vol target, decrement, rebalancing fees",
    ],
    vega: "Long vol",
    richerWhen: ["Vol ↓", "Dividends ↑", "Rates ↑", "Funding spread ↑"],
    payoff: (p) => 100 + 150 * Math.max(p - 1, 0),
    payoffNote: "100% protection, 150% participation in a 5%-vol-target index.",
  },
];
