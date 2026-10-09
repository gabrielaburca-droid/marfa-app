export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 lg:mb-8">
      <div className="min-w-0">
        <h1 className="page-title">{title}</h1>
        {description && <p className="helper mt-1.5 max-w-2xl">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function ComingSoon({ milestone, children }: { milestone: number; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-stone-300 bg-white/50 px-6 py-14 text-center">
      <p className="text-sm font-semibold text-stone-700">{children}</p>
      <p className="mt-1 text-xs text-stone-500">Se construiește în etapa {milestone}.</p>
    </div>
  );
}
