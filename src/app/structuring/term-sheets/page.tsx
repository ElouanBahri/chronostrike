import type { Metadata } from "next";
import AnnotatedTermSheet from "@/components/structuring/AnnotatedTermSheet";
import TermSheetWorksheet from "@/components/structuring/TermSheetWorksheet";

export const metadata: Metadata = {
  title: "Read term sheets · ChronoStrike",
};

const EDGAR_COMPANY_424B2 =
  "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001114446&type=424B2&dateb=&owner=include&count=40";
const EDGAR_FULL_TEXT_UI =
  "https://www.sec.gov/edgar/search/#/q=%22Trigger%20Autocallable%20Contingent%20Yield%20Notes%22&category=custom&forms=424B2";

const checklist = [
  { label: "Payoff", detail: "Coupon (fixed or contingent, memory?), autocall rule, payment at maturity. Rewrite it as the client's replicating portfolio." },
  { label: "Barrier levels", detail: "Call threshold (and any step-down), coupon barrier, downside threshold — and whether the barrier is observed daily or only at maturity." },
  { label: "Observation dates", detail: "Frequency, first callable date, final valuation date. Count the observations." },
  { label: "Estimated value vs issue price", detail: "The disclosed estimated initial value against the $1,000 issue price. The gap is the margin and costs built into the note." },
  { label: "Risk factors", detail: "Skim them all once; after that, look for what's specific to this note: worst-of language, single-stock risk, barrier observation, call schedule." },
];

export default function TermSheetsPage() {
  return (
    <div className="space-y-10">
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Where to find them</h2>
          <p className="mt-2 leading-relaxed text-foreground/90">
            UBS issues SEC-registered notes, and every final pricing supplement is filed publicly on EDGAR as a{" "}
            <span className="font-mono text-sm">424B2</span>. It&apos;s the closest you&apos;ll get to seeing your desk&apos;s
            output before day one.
          </p>
          <ol className="mt-4 space-y-2 text-sm text-foreground/90">
            <li>
              <span className="mr-2 font-mono text-accent">1</span>
              <a href={EDGAR_COMPANY_424B2} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">
                Open UBS AG&apos;s 424B2 filings ↗
              </a>{" "}
              <span className="text-muted-foreground">(CIK 0001114446)</span>
            </li>
            <li>
              <span className="mr-2 font-mono text-accent">2</span>
              Or{" "}
              <a href={EDGAR_FULL_TEXT_UI} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">
                full-text search by product name ↗
              </a>
            </li>
            <li>
              <span className="mr-2 font-mono text-accent">3</span>
              Skip the preliminary ones (they say &quot;Subject to completion&quot; and give ranges). You want final terms.
            </li>
            <li>
              <span className="mr-2 font-mono text-accent">4</span>
              Read 5 to 10, mixing worst-of autocalls, single-stock notes and a buffered or leveraged note.
            </li>
          </ol>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Break each one down</h2>
          <ul className="mt-3 space-y-3">
            {checklist.map((item) => (
              <li key={item.label} className="flex gap-3 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>
                  <span className="font-semibold text-foreground">{item.label}.</span>{" "}
                  <span className="text-foreground/80">{item.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-xl font-semibold text-foreground">Annotated example</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Laid out like a real worst-of autocall supplement. Click any line to see what it means and what to note down.
        </p>
        <AnnotatedTermSheet />
      </section>

      <section>
        <h2 className="mb-1 text-xl font-semibold text-foreground">Your turn</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Log each filing you read. For autocallables, &quot;Price it&quot; opens the pricer with the note&apos;s terms, so you
          can compare the issuer&apos;s coupon with your fair coupon.
        </p>
        <TermSheetWorksheet />
      </section>
    </div>
  );
}
