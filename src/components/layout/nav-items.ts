import type { Permission } from "@/lib/auth/permissions";

export type NavIcon = "home" | "income" | "expense" | "reports" | "settings";
export type NavItem = { href: string; label: string; icon: NavIcon; permission?: Permission };

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "home" },
  { href: "/incasari", label: "Încasări", icon: "income" },
  { href: "/cheltuieli", label: "Cheltuieli", icon: "expense" },
  { href: "/rapoarte", label: "Rapoarte", icon: "reports", permission: "reports.view" },
  { href: "/setari", label: "Setări", icon: "settings", permission: "settings.manage" },
];
