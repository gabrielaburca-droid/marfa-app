import Link from "next/link";
import { QUICK_ICONS, TONES } from "@/components/layout/icons";
import { QUICK_ACTIONS } from "@/components/layout/quick-actions";
import { MonthReportCard } from "@/components/finance/month-report";
import { Alert } from "@/components/ui/alert";
import { can } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { getMonthEntries, getMonthReport, resolveMonth } from "@/lib/finance/report";
import { greetingRO, longDateRO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const { user, membership } = await requireSession();
  const { parola, eroare, luna } = await searchParams;
  const supabase = await createClient();
  const month = await resolveMonth(supabase, membership.businessId, luna);
  const [report, entries] = await Promise.all([
    getMonthReport(supabase, membership.businessId, month),
    getMonthEntries(supabase, membership.businessId, month),
  ]);
  const firstName = (user.fullName || user.email).split(/[\s@]/)[0];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-stone-500 first-letter:uppercase">{longDateRO()}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900 lg:text-[28px]">
          {greetingRO()}, {firstName}!
        </h1>
      </div>

      {parola === "ok" && <Alert tone="success">Parola a fost salvată.</Alert>}
      {eroare === "acces" && <Alert tone="error">Nu aveți acces la pagina cerută.</Alert>}

      <section aria-labelledby="quick-title">
        <h2 id="quick-title" className="mb-3 text-sm font-semibold text-stone-500">
          Adaugă rapid
        </h2>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {QUICK_ACTIONS.map((a) => {
            const Icon = QUICK_ICONS[a.icon];
            return (
              <li key={a.href}>
                <Link
                  href={a.href}
                  className="group flex h-full flex-col gap-4 rounded-[var(--radius-card)] bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
                >
                  <span className={`flex size-11 items-center justify-center rounded-2xl ${TONES[a.tone]}`}>
                    <Icon className="size-[22px]" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-semibold text-stone-900">{a.title}</span>
                    <span className="mt-0.5 block text-xs text-stone-500">{a.hint}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <MonthReportCard
        report={report}
        income={entries.income}
        expenses={entries.expenses}
        basePath="/"
        seesAll={can(membership, "reports.view")}
      />
    </div>
  );
}
