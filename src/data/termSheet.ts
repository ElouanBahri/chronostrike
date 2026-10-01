export type FieldTag = "Payoff" | "Barriers" | "Dates" | "Valuation" | "Risk";

export interface TermSheetField {
  id: string;
  tag: FieldTag;
  label: string;
  value: string;
  explain: string;
}

/**
 * An illustrative pricing supplement, laid out like the 424B2s US issuers file on EDGAR.
 * Issuer, dates and numbers are fictional.
 */
export const sampleTermSheet: { title: string; fields: TermSheetField[] } = {
  title: "Trigger Autocallable Contingent Yield Notes linked to the least performing of the S&P 500®, Russell 2000® and Nasdaq-100®",
  fields: [
    {
      id: "underlyings",
      tag: "Payoff",
      label: "Underlying assets",
      value: "SPX, RTY, NDX — performance measured on the least performing underlying",
      explain:
        "'Least performing' = worst-of. Every test uses the index with the lowest return since the trade date. Three indices with ~0.6–0.8 correlation make a much richer short put than SPX alone, which is why the coupon is well above what a single-index note would pay. Write down: the number of underlyings and whether any is a single stock (single names → higher vol → higher coupon, more gap risk).",
    },
    {
      id: "coupon",
      tag: "Payoff",
      label: "Contingent coupon rate",
      value: "9.50% per annum (2.375% per quarter)",
      explain:
        "Paid only on observation dates where every underlying closes at or above its coupon barrier. Check whether coupons have memory (look for 'plus any previously unpaid contingent coupons'). Compare this rate with your pricer's fair coupon for the same terms — the gap is the fee plus the issuer's funding economics.",
    },
    {
      id: "autocall",
      tag: "Payoff",
      label: "Automatic call",
      value:
        "If the closing level of each underlying is ≥ its call threshold on any observation date (other than the final valuation date), the notes are called at principal + coupon.",
      explain:
        "The autocall is automatic — neither side has a choice. It caps the client's upside at the coupon and shortens the expected life, often to 1–1.5 years on a 3-year note. Note when calling starts: a 6-month non-call period is common.",
    },
    {
      id: "maturity",
      tag: "Payoff",
      label: "Payment at maturity",
      value:
        "If the final level of the least performing underlying ≥ its downside threshold: principal (+ coupon if ≥ coupon barrier). Otherwise: principal × (1 + underlying return of the least performing underlying).",
      explain:
        "This is the short down-and-in put, in legal language. Below the threshold the loss is measured from 100%, not from the threshold: a final level of 55% returns $550, not $950. That cliff is what the client is paid to take.",
    },
    {
      id: "call-threshold",
      tag: "Barriers",
      label: "Call threshold",
      value: "100% of the initial level of each underlying",
      explain:
        "Lower call thresholds (or step-down schedules like 100% → 95% → 90%) make early calls more likely, which shortens the trade and lowers the fair coupon. Record the full schedule if it steps down.",
    },
    {
      id: "coupon-barrier",
      tag: "Barriers",
      label: "Coupon barrier",
      value: "70% of the initial level of each underlying",
      explain:
        "Below this level the quarter's coupon is lost. The higher the coupon barrier, the more coupon digitals the client is short, and the higher the headline coupon. Often equal to the downside threshold on US notes.",
    },
    {
      id: "downside-threshold",
      tag: "Barriers",
      label: "Downside threshold",
      value: "60% of the initial level of each underlying — observed on the final valuation date only",
      explain:
        "The knock-in barrier of the down-and-in put. Crucial detail: US notes almost always observe it only on the final valuation date (European barrier). A daily-observed (American) barrier would be worth far more to the issuer and pay a higher coupon. This is what the downside threshold slider in the pricer models.",
    },
    {
      id: "trade-date",
      tag: "Dates",
      label: "Trade date / settlement date",
      value: "Jan 14, 2026 / Jan 21, 2026 (T+5)",
      explain:
        "Initial levels are struck at the trade-date close. The settlement lag is when the client pays and the issuer receives funding.",
    },
    {
      id: "observation-dates",
      tag: "Dates",
      label: "Observation dates",
      value: "Quarterly, from Apr 14, 2026 to the final valuation date; callable from Jul 14, 2026",
      explain:
        "Count them: quarterly over 3 years = 12 observations. The frequency drives both the coupon and the autocall probabilities. Coupon payment dates are usually a few business days after each observation.",
    },
    {
      id: "maturity-date",
      tag: "Dates",
      label: "Final valuation date / maturity date",
      value: "Jan 14, 2029 / Jan 18, 2029",
      explain:
        "The downside threshold is tested only at the final valuation date close. Check the market-disruption and postponement language: it defines what happens if an index can't be observed that day.",
    },
    {
      id: "issue-price",
      tag: "Valuation",
      label: "Issue price / underwriting discount",
      value: "$1,000.00 per note / $15.00 per note (1.50%)",
      explain:
        "The underwriting discount is the commission paid to the distributing broker (here the wealth management channel). It comes straight out of the client's economics: the coupon is set so the note is worth less than $1,000.",
    },
    {
      id: "estimated-value",
      tag: "Valuation",
      label: "Estimated initial value",
      value: "$968.20 per note",
      explain:
        "The issuer's own valuation of the note using its pricing models and its internal funding rate. The gap to the $1,000 issue price (here 3.18%) covers the selling commission, hedging costs and the issuer's expected hedging profit. US issuers have to disclose this number. Track it across filings — it's the cleanest read on how much margin sits in each product type.",
    },
    {
      id: "risk-principal",
      tag: "Risk",
      label: "Risk factors — principal at risk",
      value: "You may lose a significant portion or all of your initial investment…",
      explain:
        "The first risk factors restate the payoff: full downside exposure below the threshold, contingent coupons may be zero, and the return is capped at the coupons.",
    },
    {
      id: "risk-worst-of",
      tag: "Risk",
      label: "Risk factors — each underlying",
      value: "You are exposed to the market risk of each underlying asset…",
      explain:
        "The worst-of risk in plain words: no diversification benefit. Poor performance of any one index decides the outcome, whatever the others do. This is the client being long correlation.",
    },
    {
      id: "risk-credit",
      tag: "Risk",
      label: "Risk factors — credit and liquidity",
      value: "The notes are subject to the credit risk of the issuer… The notes will not be listed…",
      explain:
        "Unsecured issuer debt: if the issuer defaults, the client is a senior unsecured creditor (for a Swiss bank, subject to FINMA resolution powers). Secondary prices typically sit below the estimated value once the temporary issuer-buyback premium amortizes. Read the 'conflicts of interest' and 'hedging activities' risk factors too: they describe the desk's hedge.",
    },
  ],
};
