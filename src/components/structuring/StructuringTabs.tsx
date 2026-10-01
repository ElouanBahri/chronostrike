"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/structuring", step: "1", label: "Know the products" },
  { href: "/structuring/term-sheets", step: "2", label: "Read term sheets" },
  { href: "/structuring/pricer", step: "3", label: "Build a pricer" },
];

export default function StructuringTabs() {
  const pathname = usePathname();

  return (
    <nav className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-accent bg-accent-soft text-foreground"
                : "border-border bg-surface text-muted-foreground hover:border-accent/50 hover:text-foreground"
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs ${
                isActive ? "bg-accent text-accent-foreground" : "border border-border"
              }`}
            >
              {tab.step}
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
