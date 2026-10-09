import { signOut } from "@/app/(auth)/actions";
import { BottomNav, SidebarLinks } from "@/components/layout/nav-links";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { can, ROLE_LABELS } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, membership } = await requireSession();
  const items = NAV_ITEMS.filter((i) => !i.permission || can(membership, i.permission));

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-5 lg:flex">
        <div className="mb-6 flex items-center gap-2 px-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">M</div>
          <span className="truncate font-semibold">{membership.businessName}</span>
        </div>
        <nav aria-label="Navigare principală" className="flex-1">
          <SidebarLinks items={items} />
        </nav>
        <div className="border-t border-slate-200 px-3 pt-4 text-sm">
          <p className="truncate font-medium">{user.fullName || user.email}</p>
          <p className="text-xs text-slate-500">{ROLE_LABELS[membership.role]}</p>
          <form action={signOut} className="mt-3">
            <button type="submit" className="text-sm font-medium text-slate-600 hover:text-red-600">
              Ieșire din cont
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <span className="truncate font-semibold">{membership.businessName}</span>
          <form action={signOut}>
            <button type="submit" className="text-sm font-medium text-slate-600">
              Ieșire
            </button>
          </form>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-24 sm:px-6 lg:pb-10">{children}</main>
      </div>
      <BottomNav items={items} />
    </div>
  );
}
