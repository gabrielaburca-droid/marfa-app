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
    <section className="rounded-[var(--radius-card)] bg-white shadow-soft">
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
          <div>
            {title && <h2 className="text-base font-bold text-stone-900">{title}</h2>}
            {description && <p className="mt-1 max-w-2xl text-sm text-stone-500">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "green" | "red" | "amber";
  children: React.ReactNode;
}) {
  const styles = {
    neutral: "bg-stone-100 text-stone-600",
    green: "bg-brand-50 text-brand-700",
    red: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-800",
  }[tone];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles}`}>
      {children}
    </span>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-stone-50 px-6 py-10 text-center">
      <p className="text-sm font-semibold text-stone-700">{title}</p>
      {children && <div className="mt-1 text-sm text-stone-500">{children}</div>}
    </div>
  );
}
