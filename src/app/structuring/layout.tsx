import Image from "next/image";
import StructuringTabs from "@/components/structuring/StructuringTabs";

export default function StructuringLayout({ children }: LayoutProps<"/structuring">) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:py-14">
      <header className="mb-8">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          US equity structured notes, from term sheet to pricer
        </p>
        <div className="flex items-center gap-4">
          <Image src="/logo-mark.png" alt="" width={72} height={67} className="h-14 w-auto sm:h-16" priority />
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Structuring Basics</h1>
        </div>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground text-balance">
          Most US equity structuring flow is notes sold through wealth channels. Three steps: know the products
          cold, read real term sheets, then build a pricer.
        </p>
      </header>

      <div className="mb-8">
        <StructuringTabs />
      </div>

      {children}
    </main>
  );
}
