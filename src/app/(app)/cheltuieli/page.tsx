import { Fuel, Plus } from "lucide-react";
import Link from "next/link";
import { DeleteEntry } from "@/components/finance/delete-entry";
import { ExpenseItem } from "@/components/finance/entry-rows";
import { MonthNav } from "@/components/finance/month-nav";
import { PageHeader } from "@/components/layout/page-header";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";
import { can } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { getMonthEntries, getMonthReport, resolveMonth } from "@/lib/finance/report";
import { formatRON, todayRO } from "@/lib/format";
import { defaultDateIn, monthLabelLower } from "@/lib/month";
import { createClient } from "@/lib/supabase/server";
import { deleteExpense } from "./actions";
import { type CategoryOption, ExpenseForm, type SavedRate } from "./form";

export const metadata = { title: "Cheltuieli" };

export default async function Page({ searchParams }: PageProps<"/cheltuieli">) {
  const { membership } = await requireSession();
  const { luna, nou } = await searchParams;
  const supabase = await createClient();
  const businessId = membership.businessId;
  const month = await resolveMonth(supabase, businessId, luna);
  const open = typeof nou === "string" && nou !== "";

  const [report, entries, form] = await Promise.all([
    getMonthReport(supabase, businessId, month),
    getMonthEntries(supabase, businessId, month),
    open
      ? Promise.all([
          supabase
            .from("expense_categories")
            .select("id, name, report_group")
            .eq("business_id", businessId)
            .eq("is_active", true)
            .order("sort_order"),
          supabase.from("businesses").select("enabled_currencies").eq("id", businessId).single(),
          supabase
            .from("exchange_rates")
            .select("currency, rate_date, rate_to_ron")
            .eq("business_id", businessId)
            .order("rate_date", { ascending: false })
            .limit(500),
        ])
      : null,
  ]);
  const here = `/cheltuieli?luna=${month}`;
  const canDelete = can(membership, "records.delete");

  return (
    <>
      <PageHeader
        title="Cheltuieli"
        description="Marfă, drumuri, taxe de târg, amenzi. Sumele în valută se trec în lei cu cursul zilei."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`${here}&nou=combustibil`} className={buttonClass("secondary")} scroll={false}>
              <Fuel className="size-4" aria-hidden />
              Motorină
            </Link>
            <Link href={`${here}&nou=1`} className={buttonClass("primary")} scroll={false}>
              <Plus className="size-4" aria-hidden />
              Adaugă cheltuială
            </Link>
          </div>
        }
      />
      <div className="mb-4">
        <MonthNav month={month} basePath="/cheltuieli" />
      </div>
      <section className="rounded-[var(--radius-card)] bg-white p-5 shadow-soft sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold text-stone-900">
            {entries.expenses.length} {entries.expenses.length === 1 ? "cheltuială" : "cheltuieli"}
          </h2>
          <p className="text-xl font-extrabold text-rose-600 tabular">{formatRON(report.expenses)}</p>
        </div>
        {entries.expenses.length === 0 ? (
          <div className="mt-4">
            <EmptyState title={`Nicio cheltuială în ${monthLabelLower(month)}.`}>
              Apasă „Adaugă cheltuială”.
            </EmptyState>
          </div>
        ) : (
          <ul className="mt-2">
            {entries.expenses.map((e) => (
              <ExpenseItem
                key={e.id}
                e={e}
                action={
                  canDelete ? (
                    <DeleteEntry
                      id={e.id}
                      what={`cheltuiala „${e.description || e.category?.name}”`}
                      action={deleteExpense}
                    />
                  ) : undefined
                }
              />
            ))}
          </ul>
        )}
      </section>

      {form && (
        <ExpenseForm
          categories={(form[0].data ?? []) as CategoryOption[]}
          currencies={form[1].data?.enabled_currencies ?? ["RON"]}
          rates={(form[2].data ?? []) as SavedRate[]}
          date={defaultDateIn(month, todayRO())}
          token={crypto.randomUUID()}
          closeHref={here}
          fuel={nou === "combustibil"}
        />
      )}
    </>
  );
}
