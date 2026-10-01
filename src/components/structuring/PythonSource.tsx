"use client";

import { useState } from "react";

const SOURCE_PATH = "/pricer/worst_of_autocall.py";

export default function PythonSource() {
  const [source, setSource] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);

  const toggle = async () => {
    setOpen((o) => !o);
    if (source !== null) return;
    try {
      const res = await fetch(SOURCE_PATH);
      if (!res.ok) throw new Error(String(res.status));
      setSource(await res.text());
    } catch {
      setError(true);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">The Python version</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Same model in ~150 lines of NumPy: fair coupon, sensitivities, and barrier and correlation sweeps. A
            starting point to rebuild yourself, not to copy.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggle}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              open
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border text-muted-foreground hover:border-accent hover:text-foreground"
            }`}
          >
            {open ? "Hide code" : "Show code"}
          </button>
          <a
            href={SOURCE_PATH}
            download
            className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
          >
            Download .py
          </a>
        </div>
      </div>
      {open && (
        <pre className="mt-4 max-h-[32rem] overflow-auto rounded-xl border border-border bg-background/40 p-4 font-mono text-xs leading-relaxed text-foreground">
          {error ? "Couldn't load the source. Use the download link instead." : (source ?? "Loading…")}
        </pre>
      )}
    </div>
  );
}
