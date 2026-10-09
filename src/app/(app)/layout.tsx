import { LogOut, Settings2 } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { BottomNav, SidebarLinks } from "@/components/layout/nav-links";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { Logo } from "@/components/ui/logo";
import { ToastProvider } from "@/components/ui/toast";
import { can, ROLE_LABELS } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";

function initials(name: string) {
  return (
    name
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join("") || "?"
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, membership } = await requireSession();
  const items = NAV_ITEMS.filter((i) => !i.permission || can(membership, i.permission));
  const displayName = user.fullName || user.email;

  return (
    <ToastProvider>
      <div className="min-h-dvh lg:flex">
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col px-4 py-6 lg:flex">
          <div className="px-2">
            <Logo name={membership.businessName} />
          </div>
          <nav aria-label="Navigare principală" className="mt-8 flex-1">
            <SidebarLinks items={items} />
          </nav>
          <div className="flex items-center gap-3 rounded-2xl bg-white/60 p-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
              {initials(displayName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-stone-800">{displayName}</p>
              <p className="text-xs text-stone-500">{ROLE_LABELS[membership.role]}</p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                title="Ieșire din cont"
                className="rounded-lg p-2 text-stone-400 hover:bg-white hover:text-rose-600"
              >
                <LogOut className="size-4" aria-hidden />
                <span className="sr-only">Ieșire din cont</span>
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-canvas/90 px-4 py-3 backdrop-blur lg:hidden">
            <Logo name={membership.businessName} />
            <div className="flex items-center gap-1">
              {can(membership, "settings.manage") && (
                <Link
                  href="/setari"
                  className="rounded-xl p-2.5 text-stone-500 hover:bg-white"
                  aria-label="Setări"
                >
                  <Settings2 className="size-5" aria-hidden />
                </Link>
              )}
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-xl p-2.5 text-stone-500 hover:bg-white"
                  aria-label="Ieșire"
                >
                  <LogOut className="size-5" aria-hidden />
                </button>
              </form>
            </div>
          </header>
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">
            {children}
          </main>
        </div>
        <BottomNav items={items} />
      </div>
    </ToastProvider>
  );
}
