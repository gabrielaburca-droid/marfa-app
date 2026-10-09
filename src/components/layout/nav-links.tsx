"use client";

import { ChevronsLeft, ChevronsRight, Plus, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoMark, ShopLogo } from "@/components/ui/logo";
import { NAV_ICONS, QUICK_ICONS, TONES } from "./icons";
import { isActive, type NavGroup, type NavItem } from "./nav-items";
import { QUICK_ACTIONS } from "./quick-actions";

export const SIDEBAR_COOKIE = "marfa_sidebar";

/**
 * Desktop sidebar, grouped. It can shrink to icons only; the choice is kept
 * in a cookie so the server renders it the same way on the next visit.
 */
export function Sidebar({
  items,
  businessName,
  initialCollapsed,
}: {
  items: NavItem[];
  businessName: string;
  initialCollapsed: boolean;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const groups = items.reduce<[NavGroup, NavItem[]][]>((acc, item) => {
    const g = acc.find(([name]) => name === item.group);
    if (g) g[1].push(item);
    else acc.push([item.group, [item]]);
    return acc;
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "open"}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <aside
      className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-stone-200 bg-white py-5 transition-[width] duration-200 lg:flex ${
        collapsed ? "w-[76px] px-3" : "w-64 px-4"
      }`}
    >
      {collapsed ? (
        <div className="flex justify-center" title={businessName}>
          <LogoMark className="size-9" />
        </div>
      ) : (
        <div className="px-2">
          <ShopLogo className="w-full max-w-[200px]" priority />
          <p className="mt-3 flex items-center gap-1.5 border-t border-stone-100 pt-3 text-xs text-stone-500">
            <LogoMark className="size-4 shrink-0" />
            <span className="font-semibold text-stone-700">Marfa</span>
            <span aria-hidden>·</span>
            <span className="truncate">{businessName}</span>
          </p>
        </div>
      )}

      <nav aria-label="Navigare principală" className="mt-8 flex-1 space-y-6">
        {groups.map(([group, list]) => (
          <div key={group}>
            {collapsed ? (
              <div className="mx-auto mb-2 h-px w-6 bg-stone-200" aria-hidden />
            ) : (
              <p className="eyebrow mb-2 px-3">{group}</p>
            )}
            <ul className="space-y-0.5">
              {list.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = NAV_ICONS[item.icon];
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                      className={`group relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                        collapsed ? "justify-center px-0" : "px-3"
                      } ${
                        active
                          ? "bg-brand-50 text-brand-800"
                          : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                      }`}
                    >
                      {active && (
                        <span
                          className="absolute top-2 bottom-2 left-0 w-[3px] rounded-full bg-brand-600"
                          aria-hidden
                        />
                      )}
                      <Icon
                        className={`size-[18px] shrink-0 ${active ? "text-brand-700" : "text-stone-400 group-hover:text-stone-600"}`}
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      <span className={collapsed ? "sr-only" : ""}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Extinde meniul" : "Restrânge meniul"}
        aria-expanded={!collapsed}
        className={`flex items-center gap-2 rounded-xl py-2 text-xs font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-800 ${
          collapsed ? "justify-center" : "px-3"
        }`}
      >
        {collapsed ? (
          <ChevronsRight className="size-4" aria-hidden />
        ) : (
          <>
            <ChevronsLeft className="size-4" aria-hidden />
            Restrânge
          </>
        )}
      </button>
    </aside>
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
          className={`flex flex-col items-center gap-1 py-2 text-[11px] font-semibold ${active ? "text-brand-700" : "text-stone-500"}`}
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
            className="absolute inset-x-3 bottom-24 rounded-3xl border border-stone-200 bg-white p-3 shadow-[var(--shadow-lift)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="px-3 pt-2 pb-3 text-sm font-semibold text-stone-500">Ce vrei să adaugi?</p>
            <QuickGrid onPick={() => setOpen(false)} />
          </div>
        </div>
      )}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
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
              className="-mt-6 flex size-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-700/25 ring-4 ring-canvas transition-transform active:scale-95"
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

/** The four quick entries as a 2×2 grid (phone sheet and desktop menu). */
export function QuickGrid({ onPick }: { onPick?: () => void }) {
  return (
    <ul className="grid grid-cols-2 gap-2">
      {QUICK_ACTIONS.map((a) => {
        const Icon = QUICK_ICONS[a.icon];
        return (
          <li key={a.href}>
            <Link
              href={a.href}
              onClick={onPick}
              className="flex h-full flex-col gap-3 rounded-2xl bg-stone-50 p-4 transition-colors hover:bg-stone-100"
            >
              <span className={`flex size-10 items-center justify-center rounded-xl ${TONES[a.tone]}`}>
                <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-semibold text-stone-800">{a.title}</span>
                <span className="block text-xs text-stone-500">{a.hint}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
