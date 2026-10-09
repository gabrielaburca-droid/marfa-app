import { Globe, Store } from "lucide-react";
import Link from "next/link";
import { DeleteEntry } from "@/components/finance/delete-entry";
import { IncomeItem } from "@/components/finance/entry-rows";
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
import { deleteIncome } from "./actions";
import { type ChannelOption, MarketIncomeForm, SaleForm } from "./forms";

export const metadata = { title: "Încasări" };

export default async function Page({ searchParams }: PageProps<"/incasari">) {
  const { membership } = await requireSession();
  const { luna, nou } = await searchParams;
  const supabase = await createClient();
  const month = await resolveMonth(supabase, membership.businessId, luna);

  const [report, entries, channelsRes] = await Promise.all([
    getMonthReport(supabase, membership.businessId, month),
    getMonthEntries(supabase, membership.businessId, month),
    supabase
      .from("sales_channels")
      .select("id, name, kind")
      .eq("business_id", membership.businessId)
      .eq("is_active", true)
      .order("sort_order"),
  ]);
  const channels = (channelsRes.data ?? []) as ChannelOption[];
  const markets = channels.filter((c) => c.kind === "market");
  const others = channels.filter((c) => c.kind !== "market");
  const here = `/incasari?luna=${month}`;
  const date = defaultDateIn(month, todayRO());
  const canDelete = can(membership, "records.delete");

  return (
    <>
      <PageHeader
        title="Încasări"
        description="Totalul unei zile de târg sau fiecare vânzare în parte. Fiecare ban e numărat o singură dată."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`${here}&nou=online`} className={buttonClass("secondary")} scroll={false}>
              <Globe className="size-4" aria-hidden />
              Vânzare
            </Link>
            <Link href={`${here}&nou=targ`} className={buttonClass("primary")} scroll={false}>
              <Store className="size-4" aria-hidden />
              Încasare târg
            </Link>
          </div>
        }
      />
      <div className="mb-4">
        <MonthNav month={month} basePath="/incasari" />
      </div>
      <section className="surface p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold text-stone-900">
            {entries.income.length} {entries.income.length === 1 ? "intrare" : "intrări"}
          </h2>
          <p className="text-xl font-extrabold text-stone-900 tabular">{formatRON(report.income)}</p>
        </div>
        {entries.income.length === 0 ? (
          <div className="mt-4">
            <EmptyState title={`Nicio încasare în ${monthLabelLower(month)}.`}>
              Apasă „Încasare târg” pentru totalul unei zile sau „Vânzare” pentru o vânzare.
            </EmptyState>
          </div>
        ) : (
          <ul className="mt-2">
            {entries.income.map((e) => (
              <IncomeItem
                key={e.id}
                e={e}
                action={
                  canDelete ? (
                    <DeleteEntry
                      id={e.id}
                      what={`încasarea „${e.product_name || e.channel?.name}”`}
                      action={deleteIncome}
                    />
                  ) : undefined
                }
              />
            ))}
          </ul>
        )}
      </section>

      {nou === "targ" && (
        <MarketIncomeForm channels={markets} date={date} token={crypto.randomUUID()} closeHref={here} />
      )}
      {nou === "online" && (
        <SaleForm channels={others} date={date} token={crypto.randomUUID()} closeHref={here} />
      )}
    </>
  );
}
