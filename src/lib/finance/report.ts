import "server-only";
import { z } from "zod";
import { todayRO } from "@/lib/format";
import { monthOf, monthRange, parseMonth } from "@/lib/month";
import type { createClient } from "@/lib/supabase/server";
import type { ExpenseGroup } from "./labels";

type Client = Awaited<ReturnType<typeof createClient>>;

const reportSchema = z.object({
  income: z.string(),
  income_count: z.number(),
  expenses: z.string(),
  expense_count: z.number(),
  fines: z.string(),
  channels: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      kind: z.enum(["market", "online", "other"]),
      total: z.string(),
      count: z.number(),
    }),
  ),
  groups: z.array(
    z.object({
      group: z.enum(["merchandise", "transport_import", "market", "operating", "fines"]),
      total: z.string(),
      count: z.number(),
    }),
  ),
});

export type MonthReport = z.infer<typeof reportSchema> & {
  month: string;
  /** income − expenses, computed exactly from the decimal strings. */
  result: string;
};

/** Sums from Postgres stay strings; this subtracts them without floats. */
export function subtractDecimal(a: string, b: string): string {
  const toCents = (s: string) => {
    const neg = s.startsWith("-");
    const [i, f = ""] = s.replace("-", "").split(".");
    const c = BigInt(i) * 100n + BigInt((f + "00").slice(0, 2));
    return neg ? -c : c;
  };
  const d = toCents(a) - toCents(b);
  const abs = (d < 0n ? -d : d).toString().padStart(3, "0");
  return `${d < 0n ? "-" : ""}${abs.slice(0, -2)}.${abs.slice(-2)}`;
}

export async function getMonthReport(
  supabase: Client,
  businessId: string,
  month: string,
): Promise<MonthReport> {
  const [from, to] = monthRange(month);
  const { data, error } = await supabase.rpc("month_report", {
    p_business: businessId,
    p_from: from,
    p_to: to,
  });
  if (error) throw new Error(`month_report: ${error.message}`);
  const r = reportSchema.parse(data);
  return { ...r, month, result: subtractDecimal(r.income, r.expenses) };
}

/**
 * The month to show: `?luna=` when valid, otherwise the latest month that
 * has records (so the report isn't empty on the 1st), otherwise this month.
 */
export async function resolveMonth(supabase: Client, businessId: string, luna: unknown): Promise<string> {
  const chosen = parseMonth(luna);
  if (chosen) return chosen;
  const today = todayRO();
  const { data } = await supabase.rpc("latest_activity_month", { p_business: businessId, p_until: today });
  return typeof data === "string" ? monthOf(data) : monthOf(today);
}

export type { ExpenseGroup };

export type IncomeRow = {
  id: string;
  entry_kind: "aggregate" | "sale";
  entry_date: string;
  period_start: string;
  period_end: string;
  product_name: string | null;
  description: string;
  gross_amount_ron: number;
  net_amount_ron: number;
  cash_amount: number | null;
  card_amount: number | null;
  channel: { name: string; kind: "market" | "online" | "other" } | null;
};

export type ExpenseRow = {
  id: string;
  expense_date: string;
  description: string;
  supplier: string | null;
  amount: number;
  currency: string;
  exchange_rate: number;
  amount_ron: number;
  category: { name: string; report_group: ExpenseGroup } | null;
};

/** The month's income (by the day its period ends) and expenses, newest first. */
export async function getMonthEntries(supabase: Client, businessId: string, month: string) {
  const [from, to] = monthRange(month);
  const [income, expenses] = await Promise.all([
    supabase
      .from("income_entries")
      .select(
        "id, entry_kind, entry_date, period_start, period_end, product_name, description, gross_amount_ron, net_amount_ron, cash_amount, card_amount, channel:sales_channels(name, kind)",
      )
      .eq("business_id", businessId)
      .is("deleted_at", null)
      .neq("status", "cancelled")
      .gte("period_end", from)
      .lte("period_end", to)
      .order("period_end", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("expenses")
      .select(
        "id, expense_date, description, supplier, amount, currency, exchange_rate, amount_ron, category:expense_categories(name, report_group)",
      )
      .eq("business_id", businessId)
      .is("deleted_at", null)
      .gte("expense_date", from)
      .lte("expense_date", to)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);
  if (income.error) throw new Error(`income_entries: ${income.error.message}`);
  if (expenses.error) throw new Error(`expenses: ${expenses.error.message}`);
  return { income: income.data as IncomeRow[], expenses: expenses.data as ExpenseRow[] };
}
