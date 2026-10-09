import type { Permission } from "@/lib/auth/permissions";

export type NavItem = { href: string; label: string; icon: string; permission?: Permission };

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "M3 12l9-8 9 8M5 10v10h14V10" },
  { href: "/incasari", label: "Încasări", icon: "M12 19V5m0 0l-6 6m6-6l6 6" },
  { href: "/cheltuieli", label: "Cheltuieli", icon: "M12 5v14m0 0l-6-6m6 6l6-6" },
  { href: "/rapoarte", label: "Rapoarte", icon: "M4 20V10m6 10V4m6 16v-7m4 7H2", permission: "reports.view" },
  {
    href: "/setari",
    label: "Setări",
    icon: "M12 15a3 3 0 100-6 3 3 0 000 6zm7.4-3a7.4 7.4 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 00-2-1.2L14.5 2h-5l-.4 2.6a7.6 7.6 0 00-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 000 2.4l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 002 1.2l.4 2.6h5l.4-2.6a7.6 7.6 0 002-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z",
    permission: "settings.manage",
  },
];
