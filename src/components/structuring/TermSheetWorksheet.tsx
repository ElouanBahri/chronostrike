"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Breakdown {
  id: string;
  filingUrl: string;
  name: string;
  underlyings: string;
  payoffType: string;
  tenorYears: string;
  obsPerYear: string;
  couponPA: string;
  callTrigger: string;
  couponBarrier: string;
  downsideThreshold: string;
  issuePrice: string;
  estimatedValue: string;
  clientShort: string;
  riskNotes: string;
}

const STORAGE_KEY = "chronostrike.termSheetBreakdowns.v1";
const GOAL = 10;

const PAYOFF_TYPES = [
  "Phoenix autocallable",
  "Memory coupon autocallable",
  "Snowball autocallable",
  "Reverse convertible",
  "Barrier reverse convertible",
  "Principal-protected note",
  "Buffered note",
  "Leveraged / accelerated return note",
  "Digital / trigger note",
  "Index-linked (QIS)",
  "Other",
];

const AUTOCALL_STYLE: Record<string, string> = {
  "Phoenix autocallable": "phoenix",
  "Memory coupon autocallable": "memory",
  "Snowball autocallable": "snowball",
};

const emptyBreakdown = (): Breakdown => ({
  id: crypto.randomUUID(),
  filingUrl: "",
  name: "",
  underlyings: "",
  payoffType: PAYOFF_TYPES[0],
  tenorYears: "",
  obsPerYear: "4",
  couponPA: "",
  callTrigger: "100",
  couponBarrier: "",
  downsideThreshold: "",
  issuePrice: "1000",
  estimatedValue: "",
  clientShort: "",
  riskNotes: "",
});

function loadBreakdowns(): Breakdown[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Breakdown[]) : [];
  } catch {
    return [];
  }
}

function saveBreakdowns(items: Breakdown[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable (private mode etc.) — the worksheet still works for this session.
  }
}

function evGapPct(b: Breakdown): number | null {
  const issue = Number(b.issuePrice);
  const ev = Number(b.estimatedValue);
  if (!issue || !ev) return null;
  return ((issue - ev) / issue) * 100;
}

/** Link into the pricer pre-filled with this note's terms, for autocallables only. */
function pricerHref(b: Breakdown): string | null {
  const style = AUTOCALL_STYLE[b.payoffType];
  if (!style) return null;
  const params = new URLSearchParams({ style });
  const nUnderlyings = b.underlyings.split(/[,/;]| and /).filter((s) => s.trim()).length;
  if (nUnderlyings >= 2) params.set("n", String(Math.min(nUnderlyings, 3)));
  const map: [keyof Breakdown, string][] = [
    ["tenorYears", "tenor"],
    ["obsPerYear", "obs"],
    ["callTrigger", "trigger"],
    ["couponBarrier", "cb"],
    ["downsideThreshold", "dt"],
    ["couponPA", "issuerCoupon"],
  ];
  for (const [key, param] of map) if (b[key]) params.set(param, b[key]);
  return `/structuring/pricer?${params.toString()}`;
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
  wide?: boolean;
}

function Field({ label, value, onChange, placeholder, suffix, wide }: FieldProps) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-muted-foreground">
        {label}
        {suffix && <span className="ml-1 text-xs">({suffix})</span>}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-background/40 px-3 py-2 text-foreground outline-none focus:border-accent"
      />
    </label>
  );
}

export default function TermSheetWorksheet() {
  const [items, setItems] = useState<Breakdown[]>([]);
  const [draft, setDraft] = useState<Breakdown | null>(null);

  // localStorage is browser-only, so read it after mount rather than during prerender.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(loadBreakdowns());
  }, []);

  const commit = (next: Breakdown[]) => {
    setItems(next);
    saveBreakdowns(next);
  };

  const save = () => {
    if (!draft) return;
    const exists = items.some((i) => i.id === draft.id);
    commit(exists ? items.map((i) => (i.id === draft.id ? draft : i)) : [...items, draft]);
    setDraft(null);
  };

  const set = <K extends keyof Breakdown>(key: K) => (value: Breakdown[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Your breakdowns</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} / {GOAL} filings broken down · saved in this browser only
          </p>
        </div>
        {!draft && (
          <button
            onClick={() => setDraft(emptyBreakdown())}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            + Break down a filing
          </button>
        )}
      </div>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${Math.min(items.length / GOAL, 1) * 100}%` }}
        />
      </div>

      {draft && (
        <div className="mt-6 rounded-xl border border-accent bg-accent-soft p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="EDGAR filing link" value={draft.filingUrl} onChange={set("filingUrl")} placeholder="https://www.sec.gov/Archives/edgar/data/1114446/…" wide />
            <Field label="Product name" value={draft.name} onChange={set("name")} placeholder="Trigger Autocallable Contingent Yield Notes" wide />
            <Field label="Underlyings" value={draft.underlyings} onChange={set("underlyings")} placeholder="SPX, RTY, NDX" wide />
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="text-muted-foreground">Payoff type</span>
              <select
                value={draft.payoffType}
                onChange={(e) => set("payoffType")(e.target.value)}
                className="rounded-lg border border-border bg-background/40 px-3 py-2 text-foreground outline-none focus:border-accent"
              >
                {PAYOFF_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <Field label="Tenor" suffix="years" value={draft.tenorYears} onChange={set("tenorYears")} placeholder="3" />
            <Field label="Observations" suffix="per year" value={draft.obsPerYear} onChange={set("obsPerYear")} />
            <Field label="Coupon" suffix="% p.a." value={draft.couponPA} onChange={set("couponPA")} placeholder="9.5" />
            <Field label="Call trigger" suffix="% initial" value={draft.callTrigger} onChange={set("callTrigger")} />
            <Field label="Coupon barrier" suffix="% initial" value={draft.couponBarrier} onChange={set("couponBarrier")} placeholder="70" />
            <Field label="Downside threshold" suffix="% initial" value={draft.downsideThreshold} onChange={set("downsideThreshold")} placeholder="60" />
            <Field label="Issue price" suffix="$" value={draft.issuePrice} onChange={set("issuePrice")} />
            <Field label="Estimated value" suffix="$" value={draft.estimatedValue} onChange={set("estimatedValue")} placeholder="968.20" />
            <Field label="What is the client short?" value={draft.clientShort} onChange={set("clientShort")} placeholder="Worst-of DIP 100/60, coupon digitals" wide />
            <Field label="Risk factors that stood out" value={draft.riskNotes} onChange={set("riskNotes")} placeholder="European barrier; callable from month 6…" wide />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setDraft(null)}
              className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              Save breakdown
            </button>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead className="text-xs text-muted-foreground uppercase">
              <tr className="border-b border-border">
                <th className="py-2 pr-3 font-medium">Note</th>
                <th className="py-2 pr-3 font-medium">Coupon</th>
                <th className="py-2 pr-3 font-medium">Barriers (call / cpn / down)</th>
                <th className="py-2 pr-3 font-medium">EV gap</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((b) => {
                const gap = evGapPct(b);
                const href = pricerHref(b);
                return (
                  <tr key={b.id} className="align-top">
                    <td className="py-3 pr-3">
                      <div className="font-medium text-foreground">
                        {b.filingUrl ? (
                          <a href={b.filingUrl} target="_blank" rel="noreferrer" className="hover:text-accent">
                            {b.name || "Untitled note"} ↗
                          </a>
                        ) : (
                          b.name || "Untitled note"
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {b.payoffType}
                        {b.underlyings && ` · ${b.underlyings}`}
                        {b.tenorYears && ` · ${b.tenorYears}y`}
                      </div>
                      {b.clientShort && <div className="mt-1 text-xs text-foreground/80">Client short: {b.clientShort}</div>}
                    </td>
                    <td className="py-3 pr-3 font-mono">{b.couponPA ? `${b.couponPA}%` : "—"}</td>
                    <td className="py-3 pr-3 font-mono">
                      {[b.callTrigger, b.couponBarrier, b.downsideThreshold].map((v) => (v ? `${v}%` : "—")).join(" / ")}
                    </td>
                    <td className="py-3 pr-3 font-mono">{gap === null ? "—" : `${gap.toFixed(2)}%`}</td>
                    <td className="py-3 text-right whitespace-nowrap">
                      {href && (
                        <Link href={href} className="mr-3 text-accent hover:underline">
                          Price it →
                        </Link>
                      )}
                      <button onClick={() => setDraft(b)} className="mr-3 text-muted-foreground hover:text-foreground">
                        Edit
                      </button>
                      <button
                        onClick={() => commit(items.filter((i) => i.id !== b.id))}
                        className="text-muted-foreground hover:text-rose-500"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
