"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/setari", label: "Firmă" },
  { href: "/setari/utilizatori", label: "Utilizatori" },
  { href: "/setari/categorii", label: "Categorii" },
  { href: "/setari/canale", label: "Canale și locații" },
  { href: "/setari/cursuri", label: "Cursuri valutare" },
  { href: "/setari/istoric", label: "Istoric modificări" },
];

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Setări" className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-1 border-b border-slate-200">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`block whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
                  active
                    ? "border-brand-600 text-brand-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
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
