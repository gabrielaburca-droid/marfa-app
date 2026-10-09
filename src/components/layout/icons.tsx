import {
  ArrowDownRight,
  ArrowUpRight,
  ChartNoAxesColumn,
  Fuel,
  Globe,
  House,
  ReceiptText,
  Settings2,
  Store,
  type LucideIcon,
} from "lucide-react";
import type { NavIcon } from "./nav-items";
import type { QuickAction } from "./quick-actions";

export const NAV_ICONS: Record<NavIcon, LucideIcon> = {
  home: House,
  income: ArrowUpRight,
  expense: ArrowDownRight,
  reports: ChartNoAxesColumn,
  settings: Settings2,
};

export const QUICK_ICONS: Record<QuickAction["icon"], LucideIcon> = {
  market: Store,
  online: Globe,
  expense: ReceiptText,
  fuel: Fuel,
};

export const TONES: Record<QuickAction["tone"], string> = {
  green: "bg-brand-50 text-brand-700",
  sky: "bg-sky-50 text-sky-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
};
