import Link from "next/link";
import { ChannelChart } from "@/components/finance/channel-donut";
import { ExpenseGroupBars, KpiCard, RecentList, TrendChart } from "@/components/finance/dashboard";
import { MonthNav } from "@/components/finance/month-nav";
import { QUICK_ICONS, TONES } from "@/components/layout/icons";
import { QUICK_ACTIONS } from "@/components/layout/quick-actions";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/card";
import { can } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { getMonthEntries, getMonthReport, resolveMonth } from "@/lib/finance/report";
import { greetingRO, longDateRO } from "@/lib/format";
import { monthLabelLower, shiftMonth } from "@/lib/month";
import { createClient } from "@/lib/supabase/server";

const TREND_MONTHS = 6;

function Panel({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`surface p-5 sm:p-6 ${className}`}>
      <h2 className="section-title">{title}</h2>
      {description && <p className="helper mt-0.5">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const { user, membership } = await requireSession();
  const { parola, eroare, luna } = await searchParams;
  const firstName = (user.fullName || user.email).split(/[\s@]/)[0];
  const supabase = await createClient();
  const businessId = membership.businessId;
  const month = await resolveMonth(supabase, businessId, luna);

  // Oldest first; the last one is the chosen month, the one before it is "last month".
  const trendMonths = Array.from({ length: TREND_MONTHS }, (_, i) => shiftMonth(month, i - TREND_MONTHS + 1));
  const [trend, entries] = await Promise.all([
    Promise.all(trendMonths.map((m) => getMonthReport(supabase, businessId, m))),
    getMonthEntries(supabase, businessId, month),
  ]);
  const report = trend.at(-1)!;
  const previous = trend.at(-2)!;
  const seesAll = can(membership, "reports.view");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-stone-500 first-letter:uppercase">{longDateRO()}</p>
          <h1 className="page-title mt-1">
            {greetingRO()}, {firstName}!
          </h1>
          {!seesAll && <p className="helper mt-1">Vezi doar înregistrările introduse de tine.</p>}
        </div>
        <MonthNav month={month} basePath="/" />
      </div>

      {parola === "ok" && <Alert tone="success">Parola a fost salvată.</Alert>}
      {eroare === "acces" && <Alert tone="error">Nu aveți acces la pagina cerută.</Alert>}

      <section aria-label="Indicatorii lunii" className="grid gap-4 md:grid-cols-3">
        <KpiCard
          tone="income"
          label="Intrări"
          value={report.income}
          previous={previous.income}
          footnote={`${report.income_count} ${report.income_count === 1 ? "înregistrare" : "înregistrări"}`}
        />
        <KpiCard
          tone="expense"
          label="Cheltuieli"
          value={report.expenses}
          previous={previous.expenses}
          footnote={`${report.expense_count} ${report.expense_count === 1 ? "înregistrare" : "înregistrări"}`}
        />
        <KpiCard
          tone="result"
          label="Rezultat estimat"
          value={report.result}
          previous={previous.result}
          footnote="nu e profit contabil"
          featured
        />
      </section>

      <section aria-labelledby="quick-title" className="hidden sm:block">
        <h2 id="quick-title" className="sr-only">
          Adaugă rapid
        </h2>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {QUICK_ACTIONS.map((a) => {
            const Icon = QUICK_ICONS[a.icon];
            return (
              <li key={a.href}>
                <Link
                  href={a.href}
                  className="group flex h-full items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 transition hover:border-stone-300 hover:shadow-soft"
                >
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${TONES[a.tone]}`}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-stone-900">{a.title}</span>
                    <span className="block truncate text-xs text-stone-500">{a.hint}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-5">
        <Panel
          title="Intrări pe canale"
          description={`Unde s-au făcut banii în ${monthLabelLower(month)}`}
          className="lg:col-span-3"
        >
          {report.income_count > 0 ? (
            <ChannelChart report={report} />
          ) : (
            <EmptyState title={`Nicio intrare în ${monthLabelLower(month)}.`}>
              Folosește săgețile ca să alegi altă lună.
            </EmptyState>
          )}
        </Panel>
        <Panel title="Cheltuieli pe grupe" description="Pe ce s-au dus banii" className="lg:col-span-2">
          <ExpenseGroupBars report={report} />
        </Panel>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-5">
        <Panel title="Evoluție" description={`Ultimele ${TREND_MONTHS} luni`} className="lg:col-span-2">
          <TrendChart months={trend} />
        </Panel>
        <Panel title="Ultimele înregistrări" className="lg:col-span-3">
          <RecentList income={entries.income} expenses={entries.expenses} month={month} />
        </Panel>
      </div>

      <p className="rounded-2xl border border-stone-200 bg-white/60 px-4 py-3 text-sm text-stone-600">
        <b className="text-stone-800">Rezultat estimat</b> = intrări − cheltuieli din lună. Este un rezultat
        simplificat pentru urmărirea banilor, nu profit contabil: marfa cumpărată într-o lună se poate vinde
        și în lunile următoare.
        {Number(report.fines) > 0 && " Amenzile sunt incluse în cheltuieli."}
      </p>
    </div>
  );
}
