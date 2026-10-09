import type { Json } from "@/lib/supabase/database.types";

export const ENTITY_LABELS: Record<string, string> = {
  businesses: "Firmă",
  business_memberships: "Utilizator",
  income_categories: "Tip încasare",
  expense_categories: "Categorie cheltuieli",
  market_locations: "Locație",
  sales_channels: "Canal",
  exchange_rates: "Curs valutar",
  income_entries: "Încasare",
  expenses: "Cheltuială",
  attachments: "Fișier atașat",
};

export const ACTION_LABELS: Record<string, string> = {
  insert: "Adăugare",
  update: "Modificare",
  delete: "Ștergere definitivă",
  soft_delete: "Ștergere",
  restore: "Restaurare",
};

const FIELD_LABELS: Record<string, string> = {
  name: "nume",
  is_active: "activ",
  role: "rol",
  can_view_reports: "vede rapoarte",
  report_group: "grupă",
  sort_order: "ordine",
  gross_amount: "sumă",
  amount: "sumă",
  entry_date: "data",
  expense_date: "data",
  currency: "monedă",
  exchange_rate: "curs",
  rate_to_ron: "curs",
  description: "descriere",
  channel_id: "canal",
  category_id: "categorie",
  status: "stare",
  deleted_at: "șters",
};

// Columns that change as a side effect and say nothing to a reader.
const HIDDEN = new Set([
  "id",
  "business_id",
  "created_by",
  "updated_by",
  "deleted_by",
  "net_amount",
  "net_amount_ron",
  "gross_amount_ron",
  "amount_ron",
  "client_token",
]);

function show(v: Json | undefined): string {
  if (v === null || v === undefined || v === "") return "–";
  if (typeof v === "boolean") return v ? "da" : "nu";
  if (typeof v === "object") return JSON.stringify(v);
  const s = String(v);
  return s.length > 40 ? `${s.slice(0, 40)}…` : s;
}

/** One short line describing what changed, for the history table. */
export function summarizeChanges(action: string, changes: Json): string {
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) return "";
  const entries = Object.entries(changes).filter(([k]) => !HIDDEN.has(k));
  if (action === "update") {
    return entries
      .filter(([k]) => k !== "deleted_at")
      .map(([k, v]) => {
        const diff = v as { old?: Json; new?: Json };
        return `${FIELD_LABELS[k] ?? k}: ${show(diff?.old)} → ${show(diff?.new)}`;
      })
      .join("; ");
  }
  const obj = changes as Record<string, Json>;
  const title = obj.name ?? obj.description ?? obj.currency ?? obj.role;
  return title ? show(title) : "";
}
