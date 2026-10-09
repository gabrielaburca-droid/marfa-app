import type { Database } from "@/lib/supabase/database.types";

export type ExpenseGroup = Database["public"]["Enums"]["expense_group"];
export type ChannelKind = Database["public"]["Enums"]["channel_kind"];

/** Order here is the order of the breakdown in dashboard and reports. */
export const EXPENSE_GROUP_LABELS: Record<ExpenseGroup, string> = {
  merchandise: "Achiziții marfă",
  transport_import: "Transport, combustibil și import",
  market: "Târguri",
  operating: "Alte cheltuieli operaționale",
  fines: "Amenzi",
};

export const CHANNEL_KIND_LABELS: Record<ChannelKind, string> = {
  market: "Târg (fizic)",
  online: "Online",
  other: "Altele",
};
