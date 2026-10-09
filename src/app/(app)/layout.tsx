import { cookies } from "next/headers";
import { signOut } from "@/app/(auth)/actions";
import { BottomNav, Sidebar, SIDEBAR_COOKIE } from "@/components/layout/nav-links";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { TopBar } from "@/components/layout/top-bar";
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
  const collapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === "collapsed";

  return (
    <ToastProvider>
      <div className="min-h-dvh lg:flex">
        <Sidebar items={items} businessName={membership.businessName} initialCollapsed={collapsed} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar
            signOut={signOut}
            profile={{
              name: displayName,
              email: user.email,
              initials: initials(displayName),
              role: ROLE_LABELS[membership.role],
              businessName: membership.businessName,
              canSettings: can(membership, "settings.manage"),
              canAudit: can(membership, "audit.view"),
            }}
          />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-8 lg:pb-14">
            {children}
          </main>
        </div>
        <BottomNav items={items} />
      </div>
    </ToastProvider>
  );
}
