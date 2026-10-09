"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/setari", label: "Firmă" },
  { href: "/setari/utilizatori", label: "Utilizatori" },
  { href: "/setari/categorii", label: "Categorii" },
  { href: "/setari/canale", label: "Canale și locații" },
  { href: "/setari/cursuri", label: "Cursuri valutare" },
  { href: "/setari/istoric", label: "Istoric" },
];

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Setări"
      className="-mx-4 mb-6 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0"
    >
      <ul className="flex w-max gap-1 rounded-2xl bg-stone-200/50 p-1">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-xl px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  active ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
                }`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
