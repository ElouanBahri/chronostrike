/**
 * Monte Carlo pricer for a worst-of autocallable note under correlated GBM.
 *
 * The note's value is linear in the per-period coupon c:
 *   V(c) = A + c * B
 * where A is the PV of principal redemptions and B is the PV of one unit of
 * coupon across all paid periods. That means a single simulation gives the fair
 * coupon directly — c* = (target - A) / B — with no root-finding.
 *
 * Random numbers are generated once and reused across bumps (common random
 * numbers), so sensitivities are smooth instead of drowning in MC noise.
 */

export type CouponStyle = "phoenix" | "memory" | "snowball";

export interface MarketParams {
  nAssets: number;
  volatility: number; // same sigma for every underlying, decimal
  correlation: number; // pairwise (equicorrelation), decimal
  dividendYield: number; // continuous q, decimal
  rate: number; // risk-free r, decimal
}

export interface NoteParams {
  tenorYears: number;
  obsPerYear: number;
  autocallTrigger: number; // fraction of initial, e.g. 1.0
  couponBarrier: number; // e.g. 0.7
  downsideThreshold: number; // knock-in barrier, observed at maturity only (European)
  firstCallObs: number; // first observation on which the note can autocall (1-based)
  couponStyle: CouponStyle;
  fundingSpread: number; // issuer's credit spread over r, decimal
  fee: number; // upfront fee as a fraction of notional
}

export interface PricingResult {
  /** Fair coupon per year, as a fraction of notional. NaN if no coupon can make the note fair. */
  couponPA: number;
  /** PV of principal redemptions (A), as a fraction of notional. */
  principalPV: number;
  /** PV of one unit of per-period coupon (B). */
  couponAnnuity: number;
  /** Probability the note is called on each observation date (index 0 = first obs). */
  callProbByObs: number[];
  /** Probability of reaching maturity with the worst-of below the downside threshold. */
  lossProb: number;
  /** Average loss given that the threshold is breached, as a fraction of notional. */
  avgLossGivenBreach: number;
  expectedLifeYears: number;
}

export function numObs(note: Pick<NoteParams, "tenorYears" | "obsPerYear">): number {
  return Math.max(1, Math.round(note.tenorYears * note.obsPerYear));
}

// mulberry32 — small, fast, seedable; good enough for teaching-grade MC.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const MAX_ASSETS = 3;

/**
 * Standard normals for nPaths/2 base paths (the other half are antithetic).
 * Layout: [path][obs][asset], always MAX_ASSETS wide so 2- and 3-asset runs share draws.
 */
export function generateNormals(nPaths: number, nObs: number, seed = 42): Float64Array {
  const half = Math.ceil(nPaths / 2);
  const out = new Float64Array(half * nObs * MAX_ASSETS);
  const rand = mulberry32(seed);
  for (let i = 0; i < out.length; i += 2) {
    // Box–Muller
    const u1 = Math.max(rand(), 1e-12);
    const u2 = rand();
    const r = Math.sqrt(-2 * Math.log(u1));
    out[i] = r * Math.cos(2 * Math.PI * u2);
    if (i + 1 < out.length) out[i + 1] = r * Math.sin(2 * Math.PI * u2);
  }
  return out;
}

/** Lower-triangular Cholesky factor of an n x n equicorrelation matrix. */
function choleskyEqui(n: number, rho: number): number[][] {
  const C = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : rho)));
  const L = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = C[i][j];
      for (let k = 0; k < j; k++) sum -= L[i][k] * L[j][k];
      L[i][j] = i === j ? Math.sqrt(Math.max(sum, 1e-12)) : sum / L[j][j];
    }
  }
  return L;
}

/**
 * Simulates worst-of performance (min_i S_i(t_k) / S_i(0)) on every observation date.
 * Returns a Float64Array laid out as [path][obs], with nPaths = 2 * base paths.
 */
export function simulateWorst(normals: Float64Array, nObs: number, market: MarketParams, dt: number): Float64Array {
  const n = Math.min(Math.max(market.nAssets, 1), MAX_ASSETS);
  const half = normals.length / (nObs * MAX_ASSETS);
  const L = choleskyEqui(n, market.correlation);
  const sigma = market.volatility;
  const drift = (market.rate - market.dividendYield - 0.5 * sigma * sigma) * dt;
  const volStep = sigma * Math.sqrt(dt);

  const worst = new Float64Array(2 * half * nObs);
  const logS = new Float64Array(n);
  const logSAnti = new Float64Array(n);
  const z = new Float64Array(n);

  for (let p = 0; p < half; p++) {
    logS.fill(0);
    logSAnti.fill(0);
    for (let k = 0; k < nObs; k++) {
      const base = (p * nObs + k) * MAX_ASSETS;
      for (let i = 0; i < n; i++) {
        let acc = 0;
        for (let j = 0; j <= i; j++) acc += L[i][j] * normals[base + j];
        z[i] = acc;
      }
      let w = Infinity;
      let wAnti = Infinity;
      for (let i = 0; i < n; i++) {
        logS[i] += drift + volStep * z[i];
        logSAnti[i] += drift - volStep * z[i];
        if (logS[i] < w) w = logS[i];
        if (logSAnti[i] < wAnti) wAnti = logSAnti[i];
      }
      worst[p * nObs + k] = Math.exp(w);
      worst[(half + p) * nObs + k] = Math.exp(wAnti);
    }
  }
  return worst;
}

/** Evaluates the note's payoff on pre-simulated worst-of paths. */
export function evaluateNote(worst: Float64Array, nObs: number, note: NoteParams, rate: number): PricingResult {
  const nPaths = worst.length / nObs;
  const dt = 1 / note.obsPerYear;
  const discRate = rate + note.fundingSpread;
  const df = Array.from({ length: nObs }, (_, k) => Math.exp(-discRate * dt * (k + 1)));

  let A = 0;
  let B = 0;
  let lossCount = 0;
  let lossSum = 0;
  let lifeSum = 0;
  const callCounts = new Array<number>(nObs).fill(0);

  for (let p = 0; p < nPaths; p++) {
    const row = p * nObs;
    let lastPaid = 0; // index (1-based) of the last observation that paid a coupon
    for (let k = 1; k <= nObs; k++) {
      const w = worst[row + k - 1];
      const d = df[k - 1];
      const isFinal = k === nObs;
      const called = !isFinal && k >= note.firstCallObs && w >= note.autocallTrigger;

      if (note.couponStyle === "snowball") {
        // Coupons accrue silently and are paid in one lump on call, or at maturity above the coupon barrier.
        if (called || (isFinal && w >= note.couponBarrier)) B += k * d;
      } else if (w >= note.couponBarrier) {
        B += (note.couponStyle === "memory" ? k - lastPaid : 1) * d;
        lastPaid = k;
      }

      if (called) {
        A += d;
        callCounts[k - 1]++;
        lifeSum += k * dt;
        break;
      }
      if (isFinal) {
        if (w >= note.downsideThreshold) {
          A += d;
        } else {
          A += w * d;
          lossCount++;
          lossSum += 1 - w;
        }
        lifeSum += k * dt;
      }
    }
  }

  A /= nPaths;
  B /= nPaths;
  const target = 1 - note.fee;
  const perPeriod = B > 1e-12 ? (target - A) / B : NaN;

  return {
    couponPA: perPeriod * note.obsPerYear,
    principalPV: A,
    couponAnnuity: B,
    callProbByObs: callCounts.map((c) => c / nPaths),
    lossProb: lossCount / nPaths,
    avgLossGivenBreach: lossCount > 0 ? lossSum / lossCount : 0,
    expectedLifeYears: lifeSum / nPaths,
  };
}

export function priceNote(normals: Float64Array, market: MarketParams, note: NoteParams): PricingResult {
  const nObs = numObs(note);
  const worst = simulateWorst(normals, nObs, market, 1 / note.obsPerYear);
  return evaluateNote(worst, nObs, note, market.rate);
}
