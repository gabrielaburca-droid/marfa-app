import Link from "next/link";
import { QUICK_ICONS, TONES } from "@/components/layout/icons";
import { QUICK_ACTIONS } from "@/components/layout/quick-actions";
import { Alert } from "@/components/ui/alert";
import { can } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { greetingRO, longDateRO } from "@/lib/format";

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const { user, membership } = await requireSession();
  const { parola, eroare } = await searchParams;
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

      {can(membership, "reports.view") && (
        <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-stone-900">Luna aceasta</h2>
            <span className="text-xs font-medium text-stone-400">Rezultat financiar simplificat</span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-6">
            {[
              ["Încasări", "text-brand-700"],
              ["Cheltuieli", "text-rose-600"],
              ["Rezultat", "text-stone-900"],
            ].map(([label, color]) => (
              <div key={label}>
                <p className="text-sm text-stone-500">{label}</p>
                <p className={`mt-1 text-lg font-bold tabular sm:text-2xl ${color} opacity-30`}>– lei</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-stone-500">
            Cifrele apar aici după primele încasări și cheltuieli.
          </p>
        </section>
      )}
    </div>
  );
}
