import type { Permission } from "@/lib/auth/permissions";

export type NavIcon = "home" | "income" | "expense" | "reports" | "settings";
export type NavGroup = "Evidență" | "Analiză" | "Administrare";
export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
  group: NavGroup;
  permission?: Permission;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "home", group: "Evidență" },
  { href: "/incasari", label: "Încasări", icon: "income", group: "Evidență" },
  { href: "/cheltuieli", label: "Cheltuieli", icon: "expense", group: "Evidență" },
  { href: "/rapoarte", label: "Rapoarte", icon: "reports", group: "Analiză", permission: "reports.view" },
  {
    href: "/setari",
    label: "Setări",
    icon: "settings",
    group: "Administrare",
    permission: "settings.manage",
  },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Title of the current section, for the top bar. */
export function sectionTitle(pathname: string): string {
  return NAV_ITEMS.find((i) => isActive(pathname, i.href))?.label ?? "Marfa";
}
