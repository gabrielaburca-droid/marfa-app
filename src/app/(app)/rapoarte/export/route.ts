import { can } from "@/lib/auth/permissions";
import { getSessionContext } from "@/lib/auth/session";
import { getMonthEntries, getMonthReport } from "@/lib/finance/report";
import { todayRO } from "@/lib/format";
import { monthOf, parseMonth } from "@/lib/month";
import { createClient } from "@/lib/supabase/server";

/** "1234.5" → "1234,50", as Excel set to Romanian expects. */
const dec = (v: number | string) => {
  const [i, f = ""] = String(v).split(".");
  return `${i},${(f + "00").slice(0, Math.max(2, f.length))}`;
};

/** Quotes a cell; a leading = + - @ is neutralised so Excel never runs it as a formula. */
const text = (v: string | null | undefined) => {
  const s = (v ?? "").replace(/^[=+\-@\t\r]/, "'$&");
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx || !can(ctx.membership, "reports.view")) return new Response("Acces interzis", { status: 403 });

  const month = parseMonth(new URL(request.url).searchParams.get("luna")) ?? monthOf(todayRO());
  const supabase = await createClient();
  const businessId = ctx.membership.businessId;
  const [report, { income, expenses }] = await Promise.all([
    getMonthReport(supabase, businessId, month),
    getMonthEntries(supabase, businessId, month),
  ]);

  const rows: string[] = [
    [
      "Tip",
      "Data",
      "Canal / categorie",
      "Descriere",
      "Client / furnizor",
      "Sumă",
      "Monedă",
      "Curs",
      "Sumă netă RON",
    ]
      .map(text)
      .join(";"),
    ...income.map((e) =>
      [
        text(e.entry_kind === "sale" ? "Vânzare" : "Încasare totală"),
        e.period_end,
        text(e.channel?.name),
        text(e.product_name ?? ""),
        text(e.entry_kind === "sale" ? e.description : ""),
        dec(e.gross_amount_ron),
        "RON",
        "1",
        dec(e.net_amount_ron),
      ].join(";"),
    ),
    ...expenses.map((e) =>
      [
        text("Cheltuială"),
        e.expense_date,
        text(e.category?.name),
        text(e.description),
        text(e.supplier),
        dec(e.amount),
        e.currency,
        String(e.exchange_rate).replace(".", ","),
        `-${dec(e.amount_ron)}`,
      ].join(";"),
    ),
    "",
    `${text("Total intrări")};;;;;;;;${dec(report.income)}`,
    `${text("Total cheltuieli")};;;;;;;;-${dec(report.expenses)}`,
    `${text("Rezultat estimat (nu este profit contabil)")};;;;;;;;${dec(report.result)}`,
  ];

  return new Response(`﻿${rows.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="marfa-raport-${month}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
