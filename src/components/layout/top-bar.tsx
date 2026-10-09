"use client";

import { ChevronDown, History, LogOut, Plus, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ShopLogo } from "@/components/ui/logo";
import { QuickGrid } from "./nav-links";
import { sectionTitle } from "./nav-items";

/** A small popover that closes on outside click, Escape, or navigation. */
function Popover({
  label,
  button,
  children,
  align = "right",
  className = "",
}: {
  label: string;
  button: (open: boolean) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        className={className}
      >
        {button(open)}
      </button>
      {open && (
        <div
          className={`absolute top-full z-50 mt-2 rounded-2xl border border-stone-200 bg-white p-2 shadow-[var(--shadow-lift)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export type Profile = {
  name: string;
  email: string;
  initials: string;
  role: string;
  businessName: string;
  canSettings: boolean;
  canAudit: boolean;
};

function ProfileMenu({ profile, signOut }: { profile: Profile; signOut: () => Promise<void> }) {
  const item =
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-stone-700 hover:bg-stone-50";
  return (
    <Popover
      label="Contul meu"
      className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-stone-100"
      button={(open) => (
        <>
          <span className="flex size-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
            {profile.initials}
          </span>
          <span className="hidden max-w-36 truncate text-sm font-semibold text-stone-800 sm:block">
            {profile.name}
          </span>
          <ChevronDown
            className={`hidden size-4 text-stone-400 transition-transform sm:block ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </>
      )}
    >
      {() => (
        <div className="w-64">
          <div className="border-b border-stone-100 px-3 pt-2 pb-3">
            <p className="truncate text-sm font-semibold text-stone-900">{profile.name}</p>
            <p className="truncate text-xs text-stone-500">{profile.email}</p>
            <p className="mt-2 inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600">
              {profile.role} · {profile.businessName}
            </p>
          </div>
          <div className="py-1">
            {profile.canSettings && (
              <Link href="/setari" className={item}>
                <Settings2 className="size-4 text-stone-400" aria-hidden />
                Setări
              </Link>
            )}
            {profile.canAudit && (
              <Link href="/setari/istoric" className={item}>
                <History className="size-4 text-stone-400" aria-hidden />
                Istoric modificări
              </Link>
            )}
            <form action={signOut}>
              <button type="submit" className={`${item} text-rose-700 hover:bg-rose-50`}>
                <LogOut className="size-4" aria-hidden />
                Ieșire din cont
              </button>
            </form>
          </div>
        </div>
      )}
    </Popover>
  );
}

/** Minimal top bar: section title, "Adaugă" menu (desktop) and the profile menu. */
export function TopBar({ profile, signOut }: { profile: Profile; signOut: () => Promise<void> }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
        <div className="min-w-0 lg:hidden">
          <ShopLogo className="w-[140px]" priority />
        </div>
        <p className="hidden min-w-0 truncate text-sm text-stone-500 lg:block">
          {profile.businessName}
          <span className="mx-2 text-stone-300">/</span>
          <span className="font-semibold text-stone-900">{sectionTitle(pathname)}</span>
        </p>
        <div className="flex items-center gap-2">
          <div className="hidden lg:block">
            <Popover
              label="Adaugă"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              button={() => (
                <>
                  <Plus className="size-4" strokeWidth={2.4} aria-hidden />
                  Adaugă
                </>
              )}
            >
              {(close) => (
                <div className="w-[380px] p-1">
                  <QuickGrid onPick={close} />
                </div>
              )}
            </Popover>
          </div>
          <ProfileMenu profile={profile} signOut={signOut} />
        </div>
      </div>
    </header>
  );
}
