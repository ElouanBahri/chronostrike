"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Greeks" },
  { href: "/strategies", label: "Strategies" },
  { href: "/structuring", label: "Structuring" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 pt-8">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo-mark.png" alt="" width={28} height={28} className="h-7 w-7" priority />
        <span className="text-sm font-semibold tracking-tight text-foreground">ChronoStrike</span>
      </Link>
      <nav className="inline-flex overflow-hidden rounded-full border border-border bg-surface text-sm font-medium">
        {links.map((link) => {
          const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-1.5 transition-colors ${
                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
