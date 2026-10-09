import { Download } from "lucide-react";
import { channelColors } from "@/components/finance/channel-donut";
import { MonthNav } from "@/components/finance/month-nav";
import { PageHeader } from "@/components/layout/page-header";
import { buttonClass } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth/session";
import { EXPENSE_GROUP_LABELS, type ExpenseGroup } from "@/lib/finance/labels";
import { getMonthReport, resolveMonth } from "@/lib/finance/report";
import { formatRON } from "@/lib/format";
import { monthLabelLower, monthRange } from "@/lib/month";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Rapoarte" };

const cell = "px-4 py-3";

export default async function Page({ searchParams }: PageProps<"/rapoarte">) {
  const { membership } = await requirePermission("reports.view");
  const { luna } = await searchParams;
  const supabase = await createClient();
  const month = await resolveMonth(supabase, membership.businessId, luna);
  const report = await getMonthReport(supabase, membership.businessId, month);
  const [from, to] = monthRange(month);
  const groupTotal = (g: ExpenseGroup) => report.groups.find((x) => x.group === g);
  const colors = channelColors(report.channels);
  const max = Math.max(1, ...report.channels.map((c) => Number(c.total)));

  return (
    <>
      <PageHeader
        title="Rapoarte"
        description={`Raport lunar: ${formatDate(from)} – ${formatDate(to)}`}
        actions={
          <a href={`/rapoarte/export?luna=${month}`} className={buttonClass("secondary")} download>
            <Download className="size-4" aria-hidden />
            Descarcă CSV
          </a>
        }
      />
      <div className="mb-4">
        <MonthNav month={month} basePath="/rapoarte" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface p-5 sm:p-6">
          <h2 className="font-bold text-stone-900">Rezumat financiar</h2>
          <table className="mt-3 w-full text-sm">
            <tbody className="divide-y divide-stone-100">
              <tr>
                <td className={`${cell} pl-0`}>Intrări ({report.income_count})</td>
                <td className={`${cell} pr-0 text-right font-semibold text-brand-700 tabular`}>
                  {formatRON(report.income)}
                </td>
              </tr>
              {(Object.keys(EXPENSE_GROUP_LABELS) as ExpenseGroup[])
                .filter((g) => groupTotal(g))
                .map((g) => (
                  <tr key={g}>
                    <td className={`${cell} pl-0`}>{EXPENSE_GROUP_LABELS[g]}</td>
                    <td className={`${cell} pr-0 text-right text-rose-600 tabular`}>
                      −{formatRON(groupTotal(g)!.total)}
                    </td>
                  </tr>
                ))}
              <tr>
                <td className={`${cell} pl-0 font-bold text-stone-900`}>Rezultat estimat</td>
                <td
                  className={`${cell} pr-0 text-right font-extrabold tabular ${report.result.startsWith("-") ? "text-rose-600" : "text-brand-700"}`}
                >
                  {formatRON(report.result)}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="mt-4 rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-500">
            Nu este profit contabil: marfa cumpărată în {monthLabelLower(month)} se poate vinde și în lunile
            următoare. Comisioanele și transportul trecute pe o vânzare sunt deja scăzute din intrări.
          </p>
        </section>

        <section className="surface p-5 sm:p-6">
          <h2 className="font-bold text-stone-900">Intrări pe canale</h2>
          {report.channels.length === 0 ? (
            <p className="mt-4 text-sm text-stone-500">Nicio intrare în {monthLabelLower(month)}.</p>
          ) : (
            <ul className="mt-4 space-y-3.5">
              {report.channels.map((c) => (
                <li key={c.id}>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-medium text-stone-700">
                      {c.name} <span className="text-stone-500">· {c.count}</span>
                    </span>
                    <span className="font-semibold text-stone-900 tabular">{formatRON(c.total)}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(2, (Number(c.total) / max) * 100)}%`,
                        background: colors[c.id],
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
