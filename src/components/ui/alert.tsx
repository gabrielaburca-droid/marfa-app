export function Alert({ tone, children }: { tone: "error" | "success" | "info"; children: React.ReactNode }) {
  const styles = {
    error: "bg-rose-50 text-rose-800 ring-rose-100",
    success: "bg-brand-50 text-brand-800 ring-brand-100",
    info: "bg-stone-100 text-stone-700 ring-stone-200",
  }[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl px-4 py-3 text-sm ring-1 ${styles}`}
    >
      {children}
    </div>
  );
}
