"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  MAX_ASSETS,
  evaluateNote,
  generateNormals,
  numObs,
  priceNote,
  simulateWorst,
  type CouponStyle,
  type MarketParams,
  type NoteParams,
} from "@/lib/autocallMC";
import PythonSource from "./PythonSource";

interface PricerState {
  nAssets: number;
  volPct: number;
  corrPct: number;
  divPct: number;
  ratePct: number;
  tenorYears: number;
  obsPerYear: number;
  triggerPct: number;
  couponBarrierPct: number;
  downsideThresholdPct: number;
  firstCallObs: number;
  couponStyle: CouponStyle;
  fundingSpreadBp: number;
  feePct: number;
  nPaths: number;
}

const defaults: PricerState = {
  nAssets: 3,
  volPct: 25,
  corrPct: 60,
  divPct: 1.5,
  ratePct: 4,
  tenorYears: 3,
  obsPerYear: 4,
  triggerPct: 100,
  couponBarrierPct: 70,
  downsideThresholdPct: 60,
  firstCallObs: 2,
  couponStyle: "phoenix",
  fundingSpreadBp: 80,
  feePct: 1.5,
  nPaths: 20000,
};

const SWEEP_PATHS = 10000;
const OBS_FREQS = [
  { value: 12, label: "Monthly" },
  { value: 4, label: "Quarterly" },
  { value: 2, label: "Semi-annual" },
  { value: 1, label: "Annual" },
];
const STYLES: { value: CouponStyle; label: string }[] = [
  { value: "phoenix", label: "Phoenix" },
  { value: "memory", label: "Memory" },
  { value: "snowball", label: "Snowball" },
];

const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border-color)",
  borderRadius: 8,
  color: "var(--foreground)",
};

function num(raw: string | null, min: number, max: number): number | undefined {
  if (raw === null || raw.trim() === "") return undefined;
  const v = Number(raw);
  return Number.isFinite(v) ? Math.min(Math.max(v, min), max) : undefined;
}

/** Terms passed from the term-sheet worksheet ("Price it"). */
function stateFromSearchParams(params: URLSearchParams): { state: PricerState; issuerCouponPct?: number } {
  const style = params.get("style");
  const obs = num(params.get("obs"), 1, 12);
  return {
    state: {
      ...defaults,
      nAssets: num(params.get("n"), 1, MAX_ASSETS) ?? defaults.nAssets,
      couponStyle: STYLES.some((s) => s.value === style) ? (style as CouponStyle) : defaults.couponStyle,
      tenorYears: num(params.get("tenor"), 0.5, 5) ?? defaults.tenorYears,
      obsPerYear: OBS_FREQS.find((f) => f.value === obs)?.value ?? defaults.obsPerYear,
      triggerPct: num(params.get("trigger"), 50, 120) ?? defaults.triggerPct,
      couponBarrierPct: num(params.get("cb"), 30, 100) ?? defaults.couponBarrierPct,
      downsideThresholdPct: num(params.get("dt"), 30, 100) ?? defaults.downsideThresholdPct,
    },
    issuerCouponPct: num(params.get("issuerCoupon"), 0, 100),
  };
}

function toModel(s: PricerState): { market: MarketParams; note: NoteParams } {
  return {
    market: {
      nAssets: s.nAssets,
      volatility: s.volPct / 100,
      correlation: s.corrPct / 100,
      dividendYield: s.divPct / 100,
      rate: s.ratePct / 100,
    },
    note: {
      tenorYears: s.tenorYears,
      obsPerYear: s.obsPerYear,
      autocallTrigger: s.triggerPct / 100,
      couponBarrier: s.couponBarrierPct / 100,
      downsideThreshold: s.downsideThresholdPct / 100,
      firstCallObs: Math.min(s.firstCallObs, Math.max(numObs(s) - 1, 1)),
      couponStyle: s.couponStyle,
      fundingSpread: s.fundingSpreadBp / 10000,
      fee: s.feePct / 100,
    },
  };
}

const pct = (x: number, digits = 2) => (Number.isFinite(x) ? `${(x * 100).toFixed(digits)}%` : "n/a");

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (v: number) => void;
}

function Slider({ label, value, min, max, step, suffix = "", onChange }: SliderProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium text-foreground">
          {value.toLocaleString("en-US", { maximumFractionDigits: 2 })}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-accent"
      />
    </label>
  );
}

function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="inline-flex w-fit overflow-hidden rounded-full border border-border text-xs font-medium">
        {options.map((o) => (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            className={`px-3 py-1.5 transition-colors ${
              value === o.value ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-lg font-medium text-foreground">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export default function AutocallPricer() {
  const searchParams = useSearchParams();
  const initial = useMemo(() => stateFromSearchParams(new URLSearchParams(searchParams.toString())), [searchParams]);
  const [state, setState] = useState<PricerState>(initial.state);
  const issuerCouponPct = initial.issuerCouponPct;

  // Heavy MC work runs on a deferred copy, so sliders stay responsive while it catches up.
  const deferred = useDeferredValue(state);
  const isStale = deferred !== state;
  const set = <K extends keyof PricerState>(key: K) => (v: PricerState[K]) => setState((s) => ({ ...s, [key]: v }));

  const nObs = numObs(deferred);
  const normals = useMemo(() => generateNormals(deferred.nPaths, nObs), [deferred.nPaths, nObs]);
  const sweepNormals = useMemo(
    () => normals.subarray(0, Math.ceil(Math.min(SWEEP_PATHS, deferred.nPaths) / 2) * nObs * MAX_ASSETS),
    [normals, nObs, deferred.nPaths]
  );

  const results = useMemo(() => {
    const { market, note } = toModel(deferred);
    const dt = 1 / note.obsPerYear;
    const worst = simulateWorst(normals, nObs, market, dt);
    const base = evaluateNote(worst, nObs, note, market.rate);

    // Attribution: strip fee and funding, then add them back one at a time.
    const optionOnly = evaluateNote(worst, nObs, { ...note, fundingSpread: 0, fee: 0 }, market.rate).couponPA;
    const withFunding = evaluateNote(worst, nObs, { ...note, fee: 0 }, market.rate).couponPA;

    const bump = (m: Partial<MarketParams>, n: Partial<NoteParams> = {}) =>
      (priceNote(normals, { ...market, ...m }, { ...note, ...n }).couponPA - base.couponPA) * 10000;
    const sensitivities = [
      {
        label: "Vol +1 pt",
        bp: bump({ volatility: market.volatility + 0.01 }),
        why: "Client is short a put. More vol makes it worth more, so the issuer can pay more coupon.",
      },
      {
        label: "Correlation +5 pts",
        bp: bump({ correlation: Math.min(market.correlation + 0.05, 0.99) }),
        why:
          market.nAssets > 1
            ? "Client is long correlation. Names moving together makes the worst-of less bad, so the put is cheaper."
            : "Single underlying, so correlation does nothing.",
      },
      {
        label: "Dividends +50 bp",
        bp: bump({ dividendYield: market.dividendYield + 0.005 }),
        why: "A lower forward makes the down-and-in put dearer and an early call less likely.",
      },
      {
        label: "Rates +50 bp",
        bp: bump({ rate: market.rate + 0.005 }),
        why: "The zero-coupon bond is cheaper and the forward is higher (cheaper put), so more budget for coupon.",
      },
      {
        label: "Funding spread +10 bp",
        bp: bump({}, { fundingSpread: note.fundingSpread + 0.001 }),
        why: "The issuer's extra cost of borrowing is passed to the client as coupon.",
      },
    ];

    // Coupon vs downside threshold reuses the same paths; only the payoff changes.
    const sweepWorst = simulateWorst(sweepNormals, nObs, market, dt);
    const barrierSweep = Array.from({ length: 11 }, (_, i) => {
      const b = 0.4 + 0.05 * i;
      return {
        barrier: Math.round(b * 100),
        coupon: evaluateNote(sweepWorst, nObs, { ...note, downsideThreshold: b }, market.rate).couponPA * 100,
      };
    });

    const corrLevels = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95];
    const corrSweep = corrLevels.map((rho) => ({
      corr: Math.round(rho * 100),
      two: priceNote(sweepNormals, { ...market, nAssets: 2, correlation: rho }, note).couponPA * 100,
      three: priceNote(sweepNormals, { ...market, nAssets: 3, correlation: rho }, note).couponPA * 100,
    }));

    const callTimeline = base.callProbByObs.map((p, i) => ({
      obs: ((i + 1) / note.obsPerYear).toFixed(2).replace(/\.?0+$/, "") + "y",
      prob: p * 100,
    }));
    callTimeline.push({ obs: "Mat.", prob: (1 - base.callProbByObs.reduce((a, b) => a + b, 0)) * 100 });

    return { base, optionOnly, withFunding, sensitivities, barrierSweep, corrSweep, callTimeline };
  }, [deferred, normals, sweepNormals, nObs]);

  const { base, optionOnly, withFunding, sensitivities, barrierSweep, corrSweep, callTimeline } = results;
  const callProb = base.callProbByObs.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        {/* Controls */}
        <div className="space-y-5 rounded-2xl border border-border bg-surface p-5 sm:p-6 lg:self-start">
          <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Market</h3>
          <Segmented
            label="Underlyings (worst-of)"
            options={[1, 2, 3].map((n) => ({ value: n, label: n === 1 ? "Single" : `${n} names` }))}
            value={state.nAssets}
            onChange={set("nAssets")}
          />
          <Slider label="Volatility (each name)" value={state.volPct} min={10} max={60} step={1} suffix="%" onChange={set("volPct")} />
          <Slider label="Pairwise correlation" value={state.corrPct} min={0} max={95} step={5} suffix="%" onChange={set("corrPct")} />
          <Slider label="Dividend yield" value={state.divPct} min={0} max={5} step={0.25} suffix="%" onChange={set("divPct")} />
          <Slider label="Risk-free rate" value={state.ratePct} min={0} max={8} step={0.25} suffix="%" onChange={set("ratePct")} />

          <h3 className="pt-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Note</h3>
          <Segmented label="Coupon style" options={STYLES} value={state.couponStyle} onChange={set("couponStyle")} />
          <Slider label="Tenor" value={state.tenorYears} min={1} max={5} step={0.5} suffix="y" onChange={set("tenorYears")} />
          <Segmented label="Observations" options={OBS_FREQS} value={state.obsPerYear} onChange={set("obsPerYear")} />
          <Slider label="Autocall trigger" value={state.triggerPct} min={80} max={110} step={5} suffix="%" onChange={set("triggerPct")} />
          <Slider label="Coupon barrier" value={state.couponBarrierPct} min={40} max={100} step={5} suffix="%" onChange={set("couponBarrierPct")} />
          <Slider label="Downside threshold" value={state.downsideThresholdPct} min={30} max={90} step={5} suffix="%" onChange={set("downsideThresholdPct")} />
          <Slider label="First callable observation" value={Math.min(state.firstCallObs, Math.max(numObs(state) - 1, 1))} min={1} max={Math.max(numObs(state) - 1, 1)} step={1} suffix={` / ${numObs(state)}`} onChange={set("firstCallObs")} />
          <Slider label="Issuer funding spread" value={state.fundingSpreadBp} min={0} max={200} step={10} suffix=" bp" onChange={set("fundingSpreadBp")} />
          <Slider label="Upfront fee" value={state.feePct} min={0} max={4} step={0.25} suffix="%" onChange={set("feePct")} />

          <Segmented
            label="Monte Carlo paths"
            options={[5000, 20000, 50000].map((n) => ({ value: n, label: `${n / 1000}k` }))}
            value={state.nPaths}
            onChange={set("nPaths")}
          />
          <button
            onClick={() => setState(defaults)}
            className="w-full rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
          >
            Reset to defaults
          </button>
        </div>

        {/* Results */}
        <div className={`space-y-6 transition-opacity ${isStale ? "opacity-60" : ""}`}>
          <div className="rounded-2xl border border-accent bg-accent-soft p-5 sm:p-6">
            <div className="text-xs font-semibold tracking-wide text-accent uppercase">Fair coupon</div>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="font-mono text-5xl font-semibold text-foreground">{pct(base.couponPA)}</span>
              <span className="text-muted-foreground">per annum</span>
            </div>
            {issuerCouponPct !== undefined && Number.isFinite(base.couponPA) && (
              <p className="mt-2 text-sm text-foreground/90">
                The filing pays <span className="font-mono font-medium">{issuerCouponPct.toFixed(2)}%</span>, which is{" "}
                <span className="font-mono font-medium">
                  {Math.abs(issuerCouponPct - base.couponPA * 100).toFixed(2)}%
                </span>{" "}
                {issuerCouponPct < base.couponPA * 100 ? "below" : "above"} your fair coupon. Market inputs here are
                defaults: set vol, correlation and dividends to the trade date&apos;s levels before reading anything into
                the gap.
              </p>
            )}
            <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">From the short put + digitals</div>
                <div className="font-mono text-foreground">{pct(optionOnly)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">+ funding spread</div>
                <div className="font-mono text-foreground">
                  {Number.isFinite(withFunding - optionOnly) ? `+${((withFunding - optionOnly) * 100).toFixed(2)}%` : "n/a"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">− fee</div>
                <div className="font-mono text-foreground">
                  {Number.isFinite(base.couponPA - withFunding) ? `${((base.couponPA - withFunding) * 100).toFixed(2)}%` : "n/a"}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="P(autocalled)" value={pct(callProb, 1)} />
            <Stat label="Expected life" value={`${base.expectedLifeYears.toFixed(2)}y`} hint={`of ${deferred.tenorYears}y`} />
            <Stat label="P(capital loss)" value={pct(base.lossProb, 1)} />
            <Stat label="Avg loss if breached" value={pct(base.avgLossGivenBreach, 1)} hint="of notional" />
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Sensitivities</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Change in fair coupon p.a. Common random numbers, so bumps aren&apos;t swamped by Monte Carlo noise.
            </p>
            <table className="mt-3 w-full text-sm">
              <tbody className="divide-y divide-border">
                {sensitivities.map((s) => (
                  <tr key={s.label} className="align-top">
                    <td className="py-2.5 pr-3 font-medium whitespace-nowrap text-foreground">{s.label}</td>
                    <td className="py-2.5 pr-3 text-right font-mono whitespace-nowrap text-foreground">
                      {Number.isFinite(s.bp) ? `${s.bp >= 0 ? "+" : ""}${s.bp.toFixed(0)} bp` : "n/a"}
                    </td>
                    <td className="hidden py-2.5 text-muted-foreground sm:table-cell">{s.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={`grid gap-6 md:grid-cols-2 transition-opacity ${isStale ? "opacity-60" : ""}`}>
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h3 className="font-semibold text-foreground">Coupon vs downside threshold</h3>
          <p className="mt-1 text-xs text-muted-foreground">A higher barrier means a dearer put, so a higher coupon. {SWEEP_PATHS / 1000}k paths.</p>
          <div className="mt-3 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={barrierSweep} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="barrier" tickFormatter={(v: number) => `${v}%`} stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis tickFormatter={(v: number) => `${v.toFixed(0)}%`} stroke="var(--muted-foreground)" fontSize={12} width={44} />
                <Tooltip
                  formatter={(v) => [`${Number(v).toFixed(2)}%`, "Fair coupon p.a."]}
                  labelFormatter={(b) => `Downside threshold ${b}%`}
                  contentStyle={tooltipStyle}
                />
                <Line type="monotone" dataKey="coupon" stroke="var(--accent)" strokeWidth={2} dot={false} />
                {barrierSweep.some((p) => p.barrier === deferred.downsideThresholdPct) && (
                  <ReferenceDot
                    x={deferred.downsideThresholdPct}
                    y={barrierSweep.find((p) => p.barrier === deferred.downsideThresholdPct)?.coupon}
                    r={5}
                    fill="var(--accent)"
                    stroke="var(--surface)"
                    strokeWidth={2}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h3 className="font-semibold text-foreground">Coupon vs correlation</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            The client is long correlation: lower correlation means a richer coupon, and more names widens the gap.
          </p>
          <div className="mt-3 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={corrSweep} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="corr" tickFormatter={(v: number) => `${v}%`} stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis tickFormatter={(v: number) => `${v.toFixed(0)}%`} stroke="var(--muted-foreground)" fontSize={12} width={44} />
                <Tooltip
                  formatter={(v, name) => [`${Number(v).toFixed(2)}%`, name]}
                  labelFormatter={(c) => `Correlation ${c}%`}
                  contentStyle={tooltipStyle}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="three" name="Worst of 3" stroke="var(--accent)" strokeWidth={2} dot={false} />
                <Line
                  type="monotone"
                  dataKey="two"
                  name="Worst of 2"
                  stroke="var(--cosmic)"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 md:col-span-2">
          <h3 className="font-semibold text-foreground">When does it end?</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Probability of being called on each observation date, or reaching maturity. Coupons stop at the call, so
            the autocall shortens the trade exactly when markets are good.
          </p>
          <div className="mt-3 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={callTimeline} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="obs" stroke="var(--muted-foreground)" fontSize={11} interval="preserveStartEnd" />
                <YAxis tickFormatter={(v: number) => `${v.toFixed(0)}%`} stroke="var(--muted-foreground)" fontSize={12} width={44} />
                <Tooltip
                  formatter={(v) => [`${Number(v).toFixed(1)}%`, "Probability"]}
                  cursor={{ fill: "var(--accent-soft)" }}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="prob" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 text-sm leading-relaxed text-foreground/90 sm:p-6">
        <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Model</h3>
        <p className="mt-2">
          Correlated GBM under the risk-neutral measure, simulated exactly on observation dates (Cholesky on an
          equicorrelation matrix, antithetic variates). The downside threshold is European (observed only at maturity),
          like most US notes. Cash flows are discounted at the risk-free rate plus the issuer&apos;s funding spread. The
          note is linear in the coupon, V = A + c·B, so one run gives the fair coupon c* = (1 − fee − A) / B with no
          root-finding.
        </p>
        <p className="mt-2 text-muted-foreground">
          Next steps if you have time: a local or stochastic vol model (Heston) to capture skew. Under flat-vol GBM the
          short down-and-in put is underpriced, so the fair coupon here is too low for low barriers. Also try
          per-underlying vols and a correlation matrix instead of a single ρ.
        </p>
      </div>

      <PythonSource />
    </div>
  );
}
