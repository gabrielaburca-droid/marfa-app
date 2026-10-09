import { EmptyState } from "@/components/ui/card";
import type { ExpenseRow, IncomeRow, MonthReport } from "@/lib/finance/report";
import { formatRON } from "@/lib/format";
import { monthLabelLower } from "@/lib/month";
import { ChannelChart } from "./channel-donut";
import { ExpenseItem, IncomeItem } from "./entry-rows";
import { MonthNav } from "./month-nav";

function Stat({ label, value, tone }: { label: string; value: string; tone: "pos" | "neg" | "auto" }) {
  const negative = value.startsWith("-");
  const color = tone === "pos" || (tone === "auto" && !negative) ? "text-brand-700" : "text-rose-600";
  return (
    <div className="flex items-baseline justify-between gap-3 sm:block">
      <p className="text-sm text-stone-500">{label}</p>
      <p className={`text-xl font-extrabold tracking-tight tabular sm:mt-1 sm:text-[26px] ${color}`}>
        {formatRON(value)}
      </p>
    </div>
  );
}

/** The front-page monthly report: totals, income by channel, and the month's records. */
export function MonthReportCard({
  report,
  income,
  expenses,
  basePath,
  seesAll,
}: {
  report: MonthReport;
  income: IncomeRow[];
  expenses: ExpenseRow[];
  basePath: string;
  seesAll: boolean;
}) {
  const sorted = [...income].sort((a, b) => Number(b.net_amount_ron) - Number(a.net_amount_ron));
  return (
    <section
      className="rounded-[var(--radius-card)] bg-white p-5 shadow-soft sm:p-6"
      aria-labelledby="report-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="report-title" className="text-base font-bold text-stone-900">
            Raportul lunii
          </h2>
          <p className="text-sm text-stone-500">
            {seesAll ? "Intrări, cheltuieli și ce rămâne" : "Doar înregistrările introduse de tine"}
          </p>
        </div>
        <MonthNav month={report.month} basePath={basePath} />
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-3 sm:gap-6">
        <Stat label="Intrări" value={report.income} tone="pos" />
        <Stat label="Cheltuieli" value={report.expenses} tone="neg" />
        <Stat label="Rezultat estimat" value={report.result} tone="auto" />
      </div>

      <h3 className="mt-7 mb-3 text-xs font-bold tracking-wider text-stone-500 uppercase">
        Intrări pe canale
      </h3>
      {report.income_count > 0 ? (
        <ChannelChart report={report} />
      ) : (
        <EmptyState title={`Nicio intrare în ${monthLabelLower(report.month)}.`}>
          Folosește săgețile ca să alegi altă lună.
        </EmptyState>
      )}

      {expenses.length > 0 && (
        <>
          <h3 className="mt-7 mb-1 text-xs font-bold tracking-wider text-stone-500 uppercase">
            Cheltuieli ({expenses.length})
          </h3>
          <ul>
            {expenses.map((e) => (
              <ExpenseItem key={e.id} e={e} />
            ))}
          </ul>
        </>
      )}

      {sorted.length > 0 && (
        <details className="group mt-5 border-t border-stone-100 pt-4">
          <summary className="cursor-pointer text-sm font-semibold text-brand-700">
            Toate intrările lunii ({sorted.length})
          </summary>
          <ul className="mt-2">
            {sorted.map((e) => (
              <IncomeItem key={e.id} e={e} />
            ))}
          </ul>
        </details>
      )}

      <p className="mt-5 rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-500">
        <b className="text-stone-700">Rezultat estimat</b> = intrări − cheltuieli din lună. Nu este profit
        contabil: marfa cumpărată într-o lună se poate vinde și în lunile următoare.
        {Number(report.fines) > 0 && <> Amenzile ({formatRON(report.fines)}) sunt incluse în cheltuieli.</>}
      </p>
    </section>
  );
}
