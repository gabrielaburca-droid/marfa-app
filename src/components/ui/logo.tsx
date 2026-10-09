/** Brand mark: a parcel with a small coin, drawn in the brand green. */
export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect width="40" height="40" rx="12" className="fill-brand-600" />
      <path
        d="M11 16.5 20 12l9 4.5v9L20 30l-9-4.5z"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M11 16.5 20 21l9-4.5M20 21v9"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="29.5" cy="28.5" r="5" className="fill-brand-200" stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

export function Logo({ name }: { name?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <LogoMark className="size-9 shrink-0" />
      <div className="min-w-0 leading-tight">
        <p className="text-[15px] font-bold tracking-tight text-stone-900">Marfa</p>
        {name && <p className="truncate text-xs text-stone-500">{name}</p>}
      </div>
    </div>
  );
}
