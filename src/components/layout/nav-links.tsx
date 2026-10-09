"use client";

import { Plus, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV_ICONS, QUICK_ICONS, TONES } from "./icons";
import type { NavItem } from "./nav-items";
import { QUICK_ACTIONS } from "./quick-actions";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = NAV_ICONS[item.icon];
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-white text-stone-900 shadow-soft"
                  : "text-stone-500 hover:bg-white/60 hover:text-stone-800"
              }`}
            >
              <Icon className={`size-[18px] ${active ? "text-brand-600" : ""}`} strokeWidth={2} aria-hidden />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Phone navigation: four destinations around a central "add" button. */
export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Keep the bar to four links so the add button stays centred.
  const links = items.filter((i) => i.icon !== "settings").slice(0, 4);
  const left = links.slice(0, 2);
  const right = links.slice(2);

  const link = (item: NavItem) => {
    const active = isActive(pathname, item.href);
    const Icon = NAV_ICONS[item.icon];
    return (
      <li key={item.href} className="flex-1">
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={`flex flex-col items-center gap-1 py-2 text-[11px] font-medium ${active ? "text-brand-700" : "text-stone-400"}`}
        >
          <Icon className="size-[22px]" strokeWidth={active ? 2.2 : 1.8} aria-hidden />
          {item.label}
        </Link>
      </li>
    );
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-stone-900/30 backdrop-blur-[2px] lg:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Adaugă rapid"
            className="absolute inset-x-3 bottom-24 rounded-3xl bg-white p-3 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="px-3 pt-2 pb-3 text-sm font-semibold text-stone-500">Ce vrei să adaugi?</p>
            <ul className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((a) => {
                const Icon = QUICK_ICONS[a.icon];
                return (
                  <li key={a.href}>
                    <Link
                      href={a.href}
                      className="flex flex-col gap-3 rounded-2xl bg-stone-50 p-4 active:bg-stone-100"
                    >
                      <span
                        className={`flex size-10 items-center justify-center rounded-xl ${TONES[a.tone]}`}
                      >
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="text-sm font-semibold text-stone-800">{a.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/70 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        aria-label="Navigare principală"
      >
        <ul className="flex items-center">
          {left.map(link)}
          <li className="flex flex-1 justify-center">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label={open ? "Închide" : "Adaugă rapid"}
              className="-mt-6 flex size-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30 transition-transform active:scale-95"
            >
              {open ? (
                <X className="size-6" aria-hidden />
              ) : (
                <Plus className="size-7" strokeWidth={2.2} aria-hidden />
              )}
            </button>
          </li>
          {right.map(link)}
        </ul>
      </nav>
    </>
  );
}
