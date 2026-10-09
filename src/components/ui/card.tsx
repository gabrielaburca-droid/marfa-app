import { Inbox, type LucideIcon } from "lucide-react";

export function Card({
  title,
  description,
  children,
  actions,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section className="surface">
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
          <div>
            {title && <h2 className="section-title">{title}</h2>}
            {description && <p className="helper mt-1 max-w-2xl">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export type BadgeTone = "neutral" | "green" | "red" | "amber" | "gold" | "sky";

const BADGE: Record<BadgeTone, string> = {
  neutral: "bg-stone-100 text-stone-600",
  green: "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100",
  red: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100",
  amber: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-100",
  gold: "bg-gold-50 text-gold-700 ring-1 ring-inset ring-gold-100",
  sky: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-100",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${BADGE[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  children,
  icon: Icon = Inbox,
}: {
  title: string;
  children?: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/60 px-6 py-10 text-center">
      <span className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-white text-stone-400 ring-1 ring-stone-200">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="text-sm font-semibold text-stone-800">{title}</p>
      {children && <div className="helper mt-1 max-w-sm">{children}</div>}
    </div>
  );
}
