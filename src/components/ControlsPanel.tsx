"use client";

import type { OptionType } from "@/lib/blackScholes";

export interface ControlsState {
  spot: number;
  strike: number;
  daysToExpiry: number;
  volatilityPct: number;
  ratePct: number;
  optionType: OptionType;
}

interface ControlsPanelProps {
  state: ControlsState;
  onChange: (state: ControlsState) => void;
}

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}

function SliderRow({ label, value, min, max, step, suffix = "", onChange }: SliderRowProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium text-foreground">
          {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
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

export default function ControlsPanel({ state, onChange }: ControlsPanelProps) {
  const set = <K extends keyof ControlsState>(key: K, value: ControlsState[K]) =>
    onChange({ ...state, [key]: value });

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Controls</h3>
        <div className="inline-flex overflow-hidden rounded-full border border-border text-xs font-medium">
          {(["call", "put"] as const).map((t) => (
            <button
              key={t}
              onClick={() => set("optionType", t)}
              className={`px-3 py-1.5 capitalize transition-colors ${
                state.optionType === t
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <SliderRow
          label="Underlying price (S)"
          value={state.spot}
          min={1}
          max={state.strike * 2}
          step={0.5}
          suffix=" $"
          onChange={(v) => set("spot", v)}
        />
        <SliderRow
          label="Strike price (K)"
          value={state.strike}
          min={1}
          max={500}
          step={1}
          suffix=" $"
          onChange={(v) => set("strike", v)}
        />
        <SliderRow
          label="Time to expiry"
          value={state.daysToExpiry}
          min={1}
          max={730}
          step={1}
          suffix=" days"
          onChange={(v) => set("daysToExpiry", v)}
        />
        <SliderRow
          label="Implied volatility"
          value={state.volatilityPct}
          min={1}
          max={150}
          step={1}
          suffix="%"
          onChange={(v) => set("volatilityPct", v)}
        />
        <SliderRow
          label="Risk-free rate"
          value={state.ratePct}
          min={0}
          max={15}
          step={0.1}
          suffix="%"
          onChange={(v) => set("ratePct", v)}
        />
      </div>
    </div>
  );
}
