/**
 * Black-Scholes pricing and Greeks for European equity options.
 *
 * All functions are pure and run client-side — no network/server round-trip,
 * so UI sliders can recompute and redraw on every frame.
 */

export type OptionType = "call" | "put";

export interface BlackScholesInputs {
  spot: number; // S — underlying price
  strike: number; // K
  timeToExpiry: number; // T, in years
  volatility: number; // sigma, as a decimal (0.20 = 20%)
  rate: number; // r, risk-free rate as a decimal
  dividendYield?: number; // q, continuous dividend yield as a decimal
}

// Abramowitz & Stegun 7.1.26 approximation, accurate to ~1.5e-7.
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1 / (1 + p * ax);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return sign * y;
}

/** Standard normal cumulative distribution function. */
export function normCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

/** Standard normal probability density function. */
export function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

function d1d2({ spot, strike, timeToExpiry, volatility, rate, dividendYield = 0 }: BlackScholesInputs) {
  const T = Math.max(timeToExpiry, 1e-6);
  const sigma = Math.max(volatility, 1e-6);
  const d1 =
    (Math.log(spot / strike) + (rate - dividendYield + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  return { d1, d2, T, sigma };
}

/** Theoretical option price. */
export function price(inputs: BlackScholesInputs, type: OptionType): number {
  const { spot, strike, rate, dividendYield = 0 } = inputs;
  const { d1, d2, T } = d1d2(inputs);
  const discSpot = spot * Math.exp(-dividendYield * T);
  const discStrike = strike * Math.exp(-rate * T);

  return type === "call"
    ? discSpot * normCdf(d1) - discStrike * normCdf(d2)
    : discStrike * normCdf(-d2) - discSpot * normCdf(-d1);
}

/** Rate of change of option price with respect to a $1 move in the underlying. */
export function delta(inputs: BlackScholesInputs, type: OptionType): number {
  const { dividendYield = 0 } = inputs;
  const { d1, T } = d1d2(inputs);
  const discount = Math.exp(-dividendYield * T);
  return type === "call" ? discount * normCdf(d1) : -discount * normCdf(-d1);
}

/** Rate of change of delta with respect to a $1 move in the underlying (same for calls/puts). */
export function gamma(inputs: BlackScholesInputs): number {
  const { spot, dividendYield = 0 } = inputs;
  const { d1, T, sigma } = d1d2(inputs);
  return (Math.exp(-dividendYield * T) * normPdf(d1)) / (spot * sigma * Math.sqrt(T));
}

/** Sensitivity to a 1-percentage-point (0.01) change in volatility (same for calls/puts). */
export function vega(inputs: BlackScholesInputs): number {
  const { spot, dividendYield = 0 } = inputs;
  const { d1, T } = d1d2(inputs);
  return spot * Math.exp(-dividendYield * T) * normPdf(d1) * Math.sqrt(T) * 0.01;
}

/** Time decay: change in option value per calendar day (T expressed in years). */
export function theta(inputs: BlackScholesInputs, type: OptionType): number {
  const { spot, strike, rate, dividendYield = 0 } = inputs;
  const { d1, d2, T, sigma } = d1d2(inputs);
  const discSpot = spot * Math.exp(-dividendYield * T);
  const discStrike = strike * Math.exp(-rate * T);
  const term1 = -(discSpot * normPdf(d1) * sigma) / (2 * Math.sqrt(T));

  const annualTheta =
    type === "call"
      ? term1 - rate * discStrike * normCdf(d2) + dividendYield * discSpot * normCdf(d1)
      : term1 + rate * discStrike * normCdf(-d2) - dividendYield * discSpot * normCdf(-d1);

  return annualTheta / 365;
}

/** Sensitivity to a 1-percentage-point (0.01) change in the risk-free rate. */
export function rho(inputs: BlackScholesInputs, type: OptionType): number {
  const { strike, rate } = inputs;
  const { d2, T } = d1d2(inputs);
  const discStrike = strike * Math.exp(-rate * T);
  return type === "call" ? discStrike * T * normCdf(d2) * 0.01 : -discStrike * T * normCdf(-d2) * 0.01;
}

export interface Greeks {
  price: number;
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  rho: number;
}

export function computeGreeks(inputs: BlackScholesInputs, type: OptionType): Greeks {
  return {
    price: price(inputs, type),
    delta: delta(inputs, type),
    gamma: gamma(inputs),
    vega: vega(inputs),
    theta: theta(inputs, type),
    rho: rho(inputs, type),
  };
}
