import { Fuel, Globe, ReceiptText, Store, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/card";
import type { ExpenseRow, IncomeRow } from "@/lib/finance/report";
import { formatDate, formatMoney, formatNumber, formatRON } from "@/lib/format";

const rowClass = "flex items-center gap-3 border-t border-stone-100 py-3 first:border-t-0";
const iconClass = "flex size-10 shrink-0 items-center justify-center rounded-xl";

export function IncomeItem({ e, action }: { e: IncomeRow; action?: React.ReactNode }) {
  const kind = e.channel?.kind ?? "other";
  // Markets, online platforms and direct customers each get their own icon.
  const { Icon, tone } = {
    market: { Icon: Store, tone: "bg-brand-50 text-brand-700" },
    online: { Icon: Globe, tone: "bg-sky-50 text-sky-700" },
    other: { Icon: UserRound, tone: "bg-stone-100 text-stone-600" },
  }[kind];
  const sale = e.entry_kind === "sale";
  const title = sale ? e.product_name || "Vânzare" : (e.channel?.name ?? "Încasare");
  const period =
    e.period_start === e.period_end
      ? formatDate(e.period_end)
      : `${formatDate(e.period_start)} – ${formatDate(e.period_end)}`;
  const meta = sale
    ? [e.channel?.name, e.description || null, period].filter(Boolean).join(" · ")
    : [
        period,
        e.cash_amount !== null
          ? `numerar ${formatRON(e.cash_amount)}, card ${formatRON(e.card_amount)}`
          : null,
      ]
        .filter(Boolean)
        .join(" · ");
  const deducted = Number(e.gross_amount_ron) !== Number(e.net_amount_ron);
  return (
    <li className={rowClass}>
      <span className={`${iconClass} ${tone}`}>
        <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-stone-900">
          <span className="truncate" data-name>
            {title}
          </span>
          {!sale && <Badge>total zi</Badge>}
        </p>
        <p className="truncate text-xs text-stone-500">{meta}</p>
      </div>
      <div className="text-right whitespace-nowrap">
        <p className="text-sm font-bold text-stone-900 tabular">+{formatRON(e.net_amount_ron)}</p>
        {deducted && (
          <p className="text-[11px] text-stone-500 tabular">brut {formatRON(e.gross_amount_ron)}</p>
        )}
      </div>
      {action}
    </li>
  );
}

export function ExpenseItem({ e, action }: { e: ExpenseRow; action?: React.ReactNode }) {
  const fuel = /combustibil|motorin/i.test(e.category?.name ?? "");
  const Icon = fuel ? Fuel : ReceiptText;
  const fine = e.category?.report_group === "fines";
  return (
    <li className={rowClass}>
      <span className={`${iconClass} ${fuel ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>
        <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-stone-900">
          <span className="truncate" data-name>
            {e.description || e.category?.name}
          </span>
          {fine && <Badge tone="red">amendă</Badge>}
        </p>
        <p className="truncate text-xs text-stone-500">
          {[e.category?.name, e.supplier, formatDate(e.expense_date)].filter(Boolean).join(" · ")}
        </p>
      </div>
      <div className="text-right whitespace-nowrap">
        <p className="text-sm font-bold text-stone-900 tabular">−{formatRON(e.amount_ron)}</p>
        {e.currency !== "RON" && (
          <p className="text-[11px] text-stone-500 tabular">
            {formatMoney(e.amount, e.currency)} × {formatNumber(e.exchange_rate)}
          </p>
        )}
      </div>
      {action}
    </li>
  );
}
