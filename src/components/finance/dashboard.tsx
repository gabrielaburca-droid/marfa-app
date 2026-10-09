import { ArrowDownRight, ArrowUpRight, Scale, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/card";
import { EXPENSE_GROUP_LABELS, type ExpenseGroup } from "@/lib/finance/labels";
import type { ExpenseRow, IncomeRow, MonthReport } from "@/lib/finance/report";
import { formatRON } from "@/lib/format";
import { monthLabel, monthLabelLower } from "@/lib/month";
import { ExpenseItem, IncomeItem } from "./entry-rows";

const pct = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0, signDisplay: "always" });
const lei = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 });

type Tone = "income" | "expense" | "result";

const KPI: Record<Tone, { icon: LucideIcon; chip: string }> = {
  income: { icon: ArrowUpRight, chip: "bg-brand-50 text-brand-700" },
  expense: { icon: ArrowDownRight, chip: "bg-rose-50 text-rose-700" },
  result: { icon: Scale, chip: "bg-gold-50 text-gold-700" },
};

/**
 * One headline figure with the change against the previous month. For
 * expenses, going up is shown in terracotta; for income and result, in olive.
 */
export function KpiCard({
  tone,
  label,
  value,
  previous,
  footnote,
  featured = false,
}: {
  tone: Tone;
  label: string;
  value: string;
  previous: string;
  footnote: string;
  featured?: boolean;
}) {
  const { icon: Icon, chip } = KPI[tone];
  const cur = Number(value);
  const prev = Number(previous);
  const change = prev !== 0 ? ((cur - prev) / Math.abs(prev)) * 100 : null;
  const good = change === null ? null : tone === "expense" ? change <= 0 : change >= 0;
  const negative = value.startsWith("-");

  return (
    <div
      className={`surface relative flex flex-col gap-4 overflow-hidden p-5 ${featured ? "ring-1 ring-gold-100" : ""}`}
    >
      {featured && <span className="absolute inset-x-0 top-0 h-1 bg-gold-500" aria-hidden />}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-stone-600">{label}</p>
        <span className={`flex size-10 items-center justify-center rounded-xl ${chip}`}>
          <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
        </span>
      </div>
      <p
        className={`figure text-[28px] leading-none sm:text-[30px] ${tone === "result" && negative ? "text-rose-700" : "text-stone-900"}`}
      >
        {formatRON(value)}
      </p>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {change !== null ? (
          <span
            className={`rounded-full px-2 py-0.5 font-semibold ${good ? "bg-brand-50 text-brand-700" : "bg-rose-50 text-rose-700"}`}
          >
            {pct.format(change)}%
          </span>
        ) : null}
        <span className="text-stone-500">
          {change !== null ? "față de luna trecută" : "Fără date în luna trecută"} · {footnote}
        </span>
      </div>
    </div>
  );
}

export function ExpenseGroupBars({ report }: { report: MonthReport }) {
  const fills: Record<ExpenseGroup, string> = {
    merchandise: "bg-brand-600",
    transport_import: "bg-gold-500",
    market: "bg-sky-500",
    operating: "bg-stone-400",
    fines: "bg-rose-500",
  };
  const max = Math.max(1, ...report.groups.map((g) => Number(g.total)));
  if (report.groups.length === 0)
    return <EmptyState title={`Nicio cheltuială în ${monthLabelLower(report.month)}.`} />;
  return (
    <ul className="space-y-4">
      {report.groups.map((g) => (
        <li key={g.group}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium text-stone-700">
              {EXPENSE_GROUP_LABELS[g.group]}
              <span className="ml-1.5 text-xs text-stone-500">· {g.count}</span>
            </span>
            <span className="font-semibold text-stone-900 tabular">{formatRON(g.total)}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-100">
            <div
              className={`h-full rounded-full ${fills[g.group]}`}
              style={{ width: `${Math.max(2, (Number(g.total) / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Income vs expenses for the last months, as paired columns. */
export function TrendChart({ months }: { months: MonthReport[] }) {
  const W = 360;
  const H = 240;
  const pad = { top: 16, bottom: 30, left: 4, right: 4 };
  const max = Math.max(1, ...months.flatMap((m) => [Number(m.income), Number(m.expenses)]));
  const slot = (W - pad.left - pad.right) / months.length;
  const bar = Math.min(18, slot / 3.2);
  const y = (v: number) => pad.top + (H - pad.top - pad.bottom) * (1 - v / max);
  const short = (m: string) => monthLabel(m).slice(0, 3);
  const empty = months.every((m) => m.income_count === 0 && m.expense_count === 0);

  if (empty) return <EmptyState title="Încă nu sunt date pentru evoluție." />;

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-labelledby="trend-desc">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={0}
            x2={W}
            y1={y(max * f)}
            y2={y(max * f)}
            className="stroke-stone-100"
            strokeWidth={1}
          />
        ))}
        <line x1={0} x2={W} y1={y(0)} y2={y(0)} className="stroke-stone-200" strokeWidth={1} />
        {months.map((m, i) => {
          const cx = pad.left + slot * i + slot / 2;
          const inc = Number(m.income);
          const exp = Number(m.expenses);
          const last = i === months.length - 1;
          return (
            <g key={m.month}>
              <rect
                x={cx - bar - 2}
                y={y(inc)}
                width={bar}
                height={Math.max(0, y(0) - y(inc))}
                rx={4}
                className={last ? "fill-brand-600" : "fill-brand-300"}
              />
              <rect
                x={cx + 2}
                y={y(exp)}
                width={bar}
                height={Math.max(0, y(0) - y(exp))}
                rx={4}
                className={last ? "fill-rose-400" : "fill-rose-200"}
              />
              <text
                x={cx}
                y={H - 9}
                textAnchor="middle"
                className={`text-[13px] ${last ? "fill-stone-900 font-bold" : "fill-stone-500"}`}
              >
                {short(m.month)}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-stone-600">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-brand-600" aria-hidden />
          Intrări
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-rose-400" aria-hidden />
          Cheltuieli
        </span>
      </figcaption>
      <div id="trend-desc" className="sr-only">
        <table>
          <caption>Intrări și cheltuieli pe luni</caption>
          <tbody>
            {months.map((m) => (
              <tr key={m.month}>
                <th>{monthLabel(m.month)}</th>
                <td>intrări {lei.format(Number(m.income))} lei</td>
                <td>cheltuieli {lei.format(Number(m.expenses))} lei</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

/** The month's latest records, income and expenses mixed. */
export function RecentList({
  income,
  expenses,
  month,
  limit = 6,
}: {
  income: IncomeRow[];
  expenses: ExpenseRow[];
  month: string;
  limit?: number;
}) {
  const rows = [
    ...income.map((e) => ({ kind: "income" as const, date: e.period_end, e })),
    ...expenses.map((e) => ({ kind: "expense" as const, date: e.expense_date, e })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
  if (rows.length === 0)
    return (
      <EmptyState title={`Nimic înregistrat în ${monthLabelLower(month)}.`}>
        Folosește „Adaugă” pentru prima încasare sau cheltuială.
      </EmptyState>
    );
  return (
    <>
      <ul>
        {rows.map((r) =>
          r.kind === "income" ? (
            <IncomeItem key={`i-${r.e.id}`} e={r.e} />
          ) : (
            <ExpenseItem key={`e-${r.e.id}`} e={r.e} />
          ),
        )}
      </ul>
      <div className="mt-3 flex gap-4 border-t border-stone-100 pt-3 text-sm font-semibold">
        <Link href={`/incasari?luna=${month}`} className="text-brand-700 hover:text-brand-800">
          Toate încasările ({income.length})
        </Link>
        <Link href={`/cheltuieli?luna=${month}`} className="text-brand-700 hover:text-brand-800">
          Toate cheltuielile ({expenses.length})
        </Link>
      </div>
    </>
  );
}
