import { ChartNoAxesColumn, Store, Wallet } from "lucide-react";
import { LogoMark } from "@/components/ui/logo";

const POINTS = [
  { icon: Store, text: "Totalul unei zile de târg, într-un singur pas" },
  { icon: Wallet, text: "Vânzări Vinted, OLX și clienți direcți, cu comisioane scăzute" },
  { icon: ChartNoAxesColumn, text: "Raportul fiecărei luni, cu intrări, cheltuieli și ce rămâne" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="relative hidden overflow-hidden bg-brand-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <LogoMark className="size-11 [&_rect]:fill-white/15" />
          <p className="text-xl font-bold tracking-tight">Marfa</p>
        </div>
        <div className="max-w-md">
          <p className="text-[32px] leading-tight font-bold tracking-tight">
            Banii firmei, <span className="text-gold-300">limpede</span>, lună de lună.
          </p>
          <ul className="mt-8 space-y-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-[15px] text-brand-50">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="size-4" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-brand-200">
          Încasări și cheltuieli, simplu. Nu înlocuiește contabilitatea.
        </p>
        <span
          className="pointer-events-none absolute -right-24 -bottom-24 size-72 rounded-full border-[28px] border-gold-500/15"
          aria-hidden
        />
      </section>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <LogoMark className="size-14" />
            <p className="mt-4 text-xl font-bold tracking-tight text-stone-900">Marfa</p>
            <p className="helper">Încasări și cheltuieli, simplu.</p>
          </div>
          <div className="surface p-6 sm:p-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
